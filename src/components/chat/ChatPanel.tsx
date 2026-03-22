"use client";

import { useRef, useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";

export function ChatPanel() {
  const { chatMessages, chatOpen, toggleChat, markChatRead } = useGameStore();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      markChatRead();
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatOpen, chatMessages.length]);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg || sending) return;

    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    setSending(true);
    setInput("");

    await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": sessionToken,
      },
      body: JSON.stringify({ message: msg }),
    });

    setSending(false);
  };

  if (!chatOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={toggleChat}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-bg-secondary border-l border-border flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text-primary">Chat</h3>
          <button
            onClick={toggleChat}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary"
            aria-label="Close chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-3">
          {chatMessages.length === 0 && (
            <p className="text-text-muted text-sm text-center mt-8">
              No messages yet
            </p>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <span className="text-xs text-text-muted">{msg.playerName}</span>
              <div className="bg-bg-tertiary rounded-xl px-3 py-2 text-sm text-text-primary break-words">
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border px-4 py-3 flex gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 200))}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Say something..."
            className="flex-1 bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-gold min-h-[40px]"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 flex items-center justify-center bg-accent-gold rounded-xl disabled:opacity-40 text-bg-primary hover:brightness-110 transition-colors"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
