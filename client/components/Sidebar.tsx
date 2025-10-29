"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Plus, X } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  preview: string;
}

interface SidebarProps {
  recentChats: Chat[];
  onNewChat: () => void;
  onSearchChats: (query: string) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  onSelectChat: (id: string) => void;
  isOpen: boolean;
  currentChatId: string | null;
}

export default function Sidebar({
  recentChats,
  onNewChat,
  onSearchChats,
  onDeleteChat,
  onSelectChat,
  isOpen,
  currentChatId,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearchChats(value);
  };

  return (
    <div
      className={`bg-zinc-950 text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "w-64" : "w-0"
      }`}
    >
      <div className="p-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-white rounded-full"></div>
        <h1 className="text-xl font-bold">Sentinel AI</h1>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-zinc-800 hover:bg-zinc-700 text-white"
        >
          <Plus className="w-4 h-4" />
          New chat
          <kbd className="ml-auto text-xs bg-zinc-200 px-1.5 py-0.5 rounded">
            ⌘ N
          </kbd>
        </Button>
      </div>

      {/* Search Chat */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search chat"
            className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Community */}
      <div className="px-4 mb-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-white hover:bg-zinc-800"
        >
          <MessageSquare className="w-4 h-4" />
          Community
        </Button>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar-dark">
        <div className="text-xs text-zinc-400 mb-2 font-medium">Recent</div>
        <div className="space-y-1">
          {recentChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`group relative flex items-center w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 text-sm cursor-pointer ${
                currentChatId === chat.id ? "bg-zinc-800 text-white" : "text-zinc-300"
              }`}
            >
              <span className="truncate flex-1">{chat.title}</span>
              <button
                onClick={(e) => onDeleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-zinc-700 rounded"
                title="Delete chat"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Help Center */}
      <div className="p-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-white hover:bg-zinc-800"
        >
          <MessageSquare className="w-4 h-4" />
          Help Center
        </Button>
      </div>
    </div>
  );
}
