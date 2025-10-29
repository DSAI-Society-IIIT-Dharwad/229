"use client";

import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";

interface ChatHeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function ChatHeader({ onToggleSidebar, isSidebarOpen }: ChatHeaderProps) {
  return (
    <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button className="hover:cursor-pointer"
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="text-lg font-semibold">Sentinel AI</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </Button>
        <Button variant="ghost" size="icon">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full overflow-hidden"
        >
          <div className="w-8 h-8 bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            <User className="w-4 h-4" />
          </div>
        </Button>
      </div>
    </div>
  );
}
