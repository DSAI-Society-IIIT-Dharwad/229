"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Plus } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled = false }: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      onSend();
    }
  };

  return (
    <div className="mb-12">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder={disabled ? "Loading..." : "Ask Anything..."}
          className="w-full text-white h-14 pl-6 pr-28 rounded-full border-2 border-zinc-200 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white hover:bg-zinc-800"
            disabled={disabled}
            onClick={() => {
              alert("Attachment feature - Coming soon!");
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white hover:bg-zinc-800"
            disabled={disabled}
            onClick={() => {
              alert("Voice input feature - Coming soon!");
            }}
          >
            <Mic className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            className="hover:cursor-pointer rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSend}
            disabled={disabled}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
