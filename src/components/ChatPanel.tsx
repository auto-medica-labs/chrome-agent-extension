import { useState, useRef, useCallback } from "react";
import type { Profile } from "../storage";
import { streamChatCompletion, ChatError, type ChatMessage } from "../chat";
import { renderMarkdown } from "../markdown";

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
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
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
        // Abort is user-initiated — partial response stays visible
      } else if (err instanceof ChatError) {
        setError(err.message);
      } else {
        setError("Could not reach the API — check your endpoint and retry.");
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
    <div className="chat-panel">
      <div className="header">
        <span className="header-title">Conversation</span>
        <button className="btn btn-small" onClick={clearMessages}>
          Clear
        </button>
      </div>
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              className="message message-user"
              data-testid="message-user"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={m.id}
              className="message message-assistant markdown-body"
              data-testid="message-assistant"
            >
              {m.content ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(m.content),
                  }}
                />
              ) : (
                <span className="typing-dots" aria-label="AI is typing">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
          ),
        )}
      </div>
      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}
      <div className="chat-input-bar">
        <input
          className="chat-input"
          role="textbox"
          aria-label="Message input"
          placeholder="Type a message..."
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && handleSubmit()
          }
        />
        <button
          className={`btn ${isLoading ? "btn-danger" : "btn-primary"}`}
          onClick={isLoading ? stop : handleSubmit}
        >
          {isLoading ? "Stop" : "Send"}
        </button>
      </div>
    </div>
  );
}
