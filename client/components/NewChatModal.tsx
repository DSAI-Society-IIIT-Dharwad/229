"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (chatName: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onSubmit }: NewChatModalProps) {
  const [chatName, setChatName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatName.trim()) {
      onSubmit(chatName.trim());
      setChatName("");
    }
  };

  const handleClose = () => {
    setChatName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-zinc-900">New Chat</h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="chatName" className="block text-sm font-medium text-zinc-700 mb-2">
              Chat Name
            </label>
            <input
              id="chatName"
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="e.g., Project Discussion"
              className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 bg-black text-white hover:bg-zinc-800"
              disabled={!chatName.trim()}
            >
              Create Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
