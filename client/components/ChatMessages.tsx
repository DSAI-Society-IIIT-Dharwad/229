"use client";

import { useEffect, useRef } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      {messages.map((message, index) => (
        <div
          key={message.id}
          style={{
            animation: `slideInUp 0.3s ease-out ${index * 0.05}s both`,
          }}
          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              message.sender === "user"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-900"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <span className="text-xs opacity-60 mt-1 block">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
