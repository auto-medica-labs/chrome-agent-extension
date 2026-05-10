import { useState, useRef, useCallback } from "react";
import type { Profile } from "../storage";
import { streamChatCompletion, type ChatMessage } from "../chat";

interface Message extends ChatMessage {
  id: string;
}

interface ChatPanelProps {
  profile: Profile;
}

export function ChatPanel({ profile }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      await streamChatCompletion(
        profile,
        [...messages, userMessage],
        abortController.signal,
        (token) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + token },
              ];
            }
            return prev;
          });
        },
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Silently ignore abort
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, profile, messages]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div>
      <div>
        <button onClick={clearMessages}>Clear conversation</button>
      </div>
      <div role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} data-testid={`message-${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <input
        role="textbox"
        aria-label="Message input"
        value={input}
        disabled={isLoading}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && !e.shiftKey && handleSubmit()
        }
      />
      <button onClick={isLoading ? stop : handleSubmit}>
        {isLoading ? "Abort" : "Send"}
      </button>
    </div>
  );
}
