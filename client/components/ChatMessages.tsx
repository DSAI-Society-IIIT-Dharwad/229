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

function formatAIResponse(content: string) {
  // Split by lines for processing
  const lines = content.split('\n');
  const formattedLines: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    // Bold text (** or __)
    if (line.includes('**') || line.includes('__')) {
      const parts = line.split(/(\*\*.*?\*\*|__.*?__)/g);
      formattedLines.push(
        <p key={index} className="mb-2">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            } else if (part.startsWith('__') && part.endsWith('__')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
    }
    // Bullet points (*)
    else if (line.trim().startsWith('* ')) {
      formattedLines.push(
        <li key={index} className="ml-4 mb-1">
          {line.trim().substring(2)}
        </li>
      );
    }
    // Numbered lists
    else if (/^\d+\./.test(line.trim())) {
      formattedLines.push(
        <li key={index} className="ml-4 mb-1 list-decimal">
          {line.trim().replace(/^\d+\.\s*/, '')}
        </li>
      );
    }
    // Empty lines
    else if (line.trim() === '') {
      formattedLines.push(<br key={index} />);
    }
    // Regular text
    else {
      formattedLines.push(
        <p key={index} className="mb-2">
          {line}
        </p>
      );
    }
  });
  
  return <div className="formatted-content">{formattedLines}</div>;
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
    <div className="space-y-6 mb-8">
      {messages.map((message, index) => (
        <div
          key={message.id}
          style={{
            animation: `slideInUp 0.3s ease-out ${index * 0.05}s both`,
          }}
          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              message.sender === "user"
                ? "bg-black text-white"
                : "bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm"
            }`}
          >
            {message.sender === "ai" ? (
              <div className="text-sm leading-relaxed">
                {formatAIResponse(message.content)}
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{message.content}</p>
            )}
            <span className={`text-xs mt-2 block ${
              message.sender === "user" ? "text-zinc-400" : "text-zinc-500"
            }`}>
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
