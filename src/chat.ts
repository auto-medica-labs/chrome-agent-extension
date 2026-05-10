export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamProfile {
  baseUrl: string;
  model: string;
  apiKey: string;
}

export async function streamChatCompletion(
  profile: StreamProfile,
  messages: ChatMessage[],
  signal: AbortSignal,
  onToken: (token: string) => void,
): Promise<void> {
  const response = await fetch(`${profile.baseUrl}/chat/completions`, {
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

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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
}
