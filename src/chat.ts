export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamProfile {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export type ChatErrorType =
  | "unreachable"
  | "unauthorized"
  | "rate_limited"
  | "server_error";

export class ChatError extends Error {
  type: ChatErrorType;
  constructor(type: ChatErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = "ChatError";
  }
}

function httpStatusToChatError(status: number): ChatError {
  if (status === 401) {
    return new ChatError("unauthorized", "Invalid API key — check your API key in settings.");
  }
  if (status === 429) {
    return new ChatError("rate_limited", "Rate limited — retry later.");
  }
  if (status >= 500) {
    return new ChatError("server_error", "Server error — retry later.");
  }
  return new ChatError("unreachable", `Could not reach the API (HTTP ${status}) — check your endpoint and retry.`);
}

export async function streamChatCompletion(
  profile: StreamProfile,
  messages: ChatMessage[],
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${profile.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${profile.apiKey}`,
      },
      body: JSON.stringify({
        model: profile.model,
        messages,
        stream: true,
      }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ChatError(
      "unreachable",
      "Could not reach the API — check your endpoint and retry.",
    );
  }

  if (!response.ok || !response.body) {
    throw httpStatusToChatError(response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) onToken(token);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ChatError(
      "unreachable",
      "Stream interrupted — partial response shown above. Check your connection and retry.",
    );
  }
}
