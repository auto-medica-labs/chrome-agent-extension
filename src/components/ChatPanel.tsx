import { useState, useRef, useCallback, useEffect } from "react";
import type { Profile } from "../storage";
import { streamChatCompletion, ChatError, type ChatMessage } from "../chat";
import { renderMarkdown } from "../markdown";

interface Message extends ChatMessage {
  id: string;
}

interface ChatPanelProps {
  profile: Profile;
}

function adjustTextareaHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function ChatPanel({ profile }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) adjustTextareaHeight(el);
  }, [input]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.nativeEvent.isComposing &&
        input.trim() !== ""
      ) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, input],
  );

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col">
      {/* Chat messages area */}
      <div
        ref={chatContainerRef}
        className="scrollbar-custom flex-1 overflow-y-auto"
      >
        <div className="mx-auto flex h-full max-w-3xl flex-col gap-8 px-5 pt-6 xl:max-w-4xl xl:pt-10">
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center gap-8 text-center">
              <div className="select-none text-3xl font-semibold text-gray-900 dark:text-gray-100">
                AI Chat
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 pb-4">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div
                    key={m.id}
                    className="group relative w-full"
                    data-testid="message-user"
                  >
                    <p className="w-full appearance-none whitespace-break-spaces break-words bg-inherit px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      {m.content.trim()}
                    </p>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className="group relative -mb-4 flex w-fit max-w-full items-start gap-4 pb-4 leading-relaxed"
                    data-testid="message-assistant"
                  >
                    {/* Avatar */}
                    <div className="mt-5 size-3.5 flex-none select-none rounded-full bg-gray-300 shadow-lg dark:bg-gray-600 max-sm:hidden" />
                    <div className="relative flex min-w-[60px] flex-col gap-2 break-words rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 px-5 py-3.5 text-gray-600 dark:border-gray-800 dark:from-gray-800/80 dark:text-gray-300">
                      {m.content ? (
                        <>
                          <div
                            className="prose max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-pre:bg-gray-800 prose-img:my-0 prose-img:rounded-lg dark:prose-pre:bg-gray-900"
                            dangerouslySetInnerHTML={{
                              __html: renderMarkdown(m.content),
                            }}
                          />
                          <div className="mt-2 border-t border-gray-100 pt-2 text-right text-[11px] text-gray-400 dark:border-gray-700 dark:text-gray-500">
                            generated by {profile.model}
                          </div>
                        </>
                      ) : (
                        <span
                          className="loading-dots text-gray-400 dark:text-gray-400"
                          aria-label="AI is typing"
                        />
                      )}
                    </div>
                  </div>
                ),
              )}

              {/* Spacer at bottom */}
              <div className="h-52 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient fade + input area */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto flex w-full max-w-3xl flex-col items-center justify-center bg-gradient-to-t from-white via-white/100 to-white/0 px-3.5 pt-2 dark:from-gray-900 dark:via-gray-900/100 dark:to-gray-900/0 sm:px-5 md:pb-4 xl:max-w-4xl [&>*]:pointer-events-auto"
      >
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-2 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* Input form */}
        <div className="w-full">
          <form
            className="relative flex w-full items-center rounded-xl border bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              className="scrollbar-custom max-h-[8lh] w-full resize-none overflow-y-auto border-0 bg-transparent px-3 py-2.5 text-smd text-gray-700 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-gray-300 dark:placeholder:text-gray-500 sm:px-4"
              placeholder="Ask anything"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label="Message input"
            />
            {isLoading ? (
              <button
                type="button"
                className="absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-full border bg-white text-black shadow transition-none dark:border-transparent dark:bg-gray-600 dark:text-white sm:size-7"
                onClick={stop}
                aria-label="Stop generating"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className={`absolute bottom-2 right-2 inline-flex size-8 items-center justify-center rounded-full border bg-white text-black shadow transition sm:size-7 ${
                  input.trim()
                    ? "!bg-black !text-white dark:!bg-white dark:!text-black"
                    : "hover:bg-white hover:shadow-inner dark:border-transparent dark:bg-gray-600 dark:text-white dark:hover:bg-black"
                }`}
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </form>

          {/* Model info + disclaimer */}
          <div className="mt-1.5 flex h-5 items-center gap-1 whitespace-nowrap px-0.5 text-xs text-gray-400/90 dark:text-gray-500">
            <span className="inline-flex items-center gap-1">
              Model: {profile.name}
            </span>
            {messages.length === 0 && !isLoading && (
              <span className="max-sm:hidden">
                Generated content may be inaccurate or false.
              </span>
            )}
            {messages.length > 0 && (
              <button
                className="ml-auto text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                onClick={clearMessages}
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
