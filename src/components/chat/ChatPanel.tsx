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
        className="fixed inset-0 z-40 bg-black/40"
        onClick={toggleChat}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-surface-DEFAULT border-l border-surface-overlay flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-overlay">
          <h3 className="font-semibold text-card-white">Chat</h3>
          <button
            onClick={toggleChat}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-card-white rounded-lg hover:bg-surface-elevated"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-3">
          {chatMessages.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-8">
              No messages yet
            </p>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">{msg.playerName}</span>
              <div className="bg-surface-elevated rounded-xl px-3 py-2 text-sm text-card-white break-words">
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-surface-overlay px-4 py-3 flex gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 200))}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Say something..."
            className="flex-1 bg-surface-elevated border border-surface-overlay rounded-xl px-3 py-2 text-sm text-card-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-chip-gold min-h-[40px]"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 flex items-center justify-center bg-felt-green rounded-xl border border-felt-light disabled:opacity-40 text-card-white hover:bg-felt-light transition-colors"
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
