"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ChatHeader";
import WelcomeSection from "@/components/WelcomeSection";
import ChatInput from "@/components/ChatInput";
import TopicCards from "@/components/TopicCards";
import ChatMessages from "@/components/ChatMessages";
import NewChatModal from "@/components/NewChatModal";

export interface Chat {
  id: string;
  title: string;
  preview: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface ChatHistoryItem {
  role: "human" | "ai";
  content: string;
}

const Index = () => {
  const [chatInput, setChatInput] = useState("");
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("recentChats");
    if (savedChats) {
      setRecentChats(JSON.parse(savedChats));
    } else {
      // Initialize with sample data
      const initialChats: Chat[] = [
        {
          id: "1",
          title: "Quick access to your lates...",
          preview: "Recent conversation",
        },
        {
          id: "2",
          title: "Pick up right where you le...",
          preview: "Previous discussion",
        },
      ];
      setRecentChats(initialChats);
      localStorage.setItem("recentChats", JSON.stringify(initialChats));
    }
  }, []);

  const handleNewChat = () => {
    setIsNewChatModalOpen(true);
  };

  const handleCreateChat = (chatTitle: string) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: chatTitle.trim(),
      preview: "Just started",
    };
    const updatedChats = [newChat, ...recentChats];
    setRecentChats(updatedChats);
    localStorage.setItem("recentChats", JSON.stringify(updatedChats));
    
    // Set as current chat and clear messages and history
    setCurrentChatId(newChat.id);
    setMessages([]);
    setChatHistory([]);
    localStorage.setItem(`chat_${newChat.id}`, JSON.stringify([]));
    localStorage.setItem(`chat_history_${newChat.id}`, JSON.stringify([]));
    
    setIsNewChatModalOpen(false);
  };

  const handleSearchChats = (query: string) => {
    const savedChats = localStorage.getItem("recentChats");
    if (savedChats) {
      const allChats = JSON.parse(savedChats);
      if (query.trim() === "") {
        setRecentChats(allChats);
      } else {
        const filtered = allChats.filter(
          (chat: Chat) =>
            chat.title.toLowerCase().includes(query.toLowerCase()) ||
            chat.preview.toLowerCase().includes(query.toLowerCase())
        );
        setRecentChats(filtered);
      }
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChats = recentChats.filter((chat) => chat.id !== id);
    setRecentChats(updatedChats);
    localStorage.setItem("recentChats", JSON.stringify(updatedChats));
    localStorage.removeItem(`chat_${id}`);
    localStorage.removeItem(`chat_history_${id}`);
    
    // If deleted chat was active, clear current chat
    if (currentChatId === id) {
      setCurrentChatId(null);
      setMessages([]);
      setChatHistory([]);
    }
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    const savedMessages = localStorage.getItem(`chat_${id}`);
    const savedHistory = localStorage.getItem(`chat_history_${id}`);
    
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([]);
    }
    
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    } else {
      setChatHistory([]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    // Check if there's an active chat, if not create one
    let activeChatId = currentChatId;
    if (!activeChatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: chatInput.substring(0, 30) + (chatInput.length > 30 ? "..." : ""),
        preview: chatInput.substring(0, 50),
      };
      const updatedChats = [newChat, ...recentChats];
      setRecentChats(updatedChats);
      localStorage.setItem("recentChats", JSON.stringify(updatedChats));
      activeChatId = newChat.id;
      setCurrentChatId(activeChatId);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: chatInput,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = chatInput;
    setChatInput("");
    setIsLoading(true);

    // Save to localStorage
    localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(updatedMessages));
    
    // Update chat preview
    const updatedChats = recentChats.map(chat => 
      chat.id === activeChatId 
        ? { ...chat, preview: currentInput.substring(0, 50) }
        : chat
    );
    setRecentChats(updatedChats);
    localStorage.setItem("recentChats", JSON.stringify(updatedChats));

    try {
      // Call AI Chat API
      const response = await fetch("http://10.0.15.84:8001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: currentInput,
          chat_history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract AI response and new chat history
      const aiResponseContent = data.ai_response || "Sorry, I couldn't process that request.";
      const newChatHistory = data.new_chat_history || [];

      // Update chat history state
      setChatHistory(newChatHistory);
      localStorage.setItem(`chat_history_${activeChatId}`, JSON.stringify(newChatHistory));

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: "ai",
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(finalMessages));
    } catch (error) {
      console.error("Error communicating with AI:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I couldn't connect to the AI service. Please make sure the server is running at http://10.0.15.84:8001",
        sender: "ai",
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      localStorage.setItem(`chat_${activeChatId}`, JSON.stringify(finalMessages));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = (topicId: string) => {
    localStorage.setItem("selectedTopic", topicId);
  };

  return (
    <div className="flex h-screen">
      <div className="flex flex-1">
        <Sidebar
          recentChats={recentChats}
          onNewChat={handleNewChat}
          onSearchChats={handleSearchChats}
          onDeleteChat={handleDeleteChat}
          onSelectChat={handleSelectChat}
          isOpen={isSidebarOpen}
          currentChatId={currentChatId}
        />
        
        {/* Main Content */}
        <div className="flex-1 bg-black p-3 rounded-r-2xl">
          <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden">
            <ChatHeader 
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />
            
            {messages.length === 0 ? (
              // Welcome screen with centered input
              <div className="flex-1 overflow-y-auto custom-scrollbar-light">
                <div className="max-w-4xl mx-auto px-6 py-16">
                  <WelcomeSection />
                  <ChatInput
                    value={chatInput}
                    onChange={setChatInput}
                    onSend={handleSendMessage}
                    disabled={isLoading}
                  />
                  <TopicCards onTopicClick={handleTopicClick} />
                </div>
              </div>
            ) : (
              // Chat mode with fixed bottom input
              <>
                <div className="flex-1 overflow-y-auto custom-scrollbar-light">
                  <div className="max-w-4xl mx-auto px-6 py-16">
                    <ChatMessages messages={messages} />
                  </div>
                </div>
                <div className="border-t border-zinc-100 bg-white">
                  <div className="max-w-4xl mx-auto px-6 py-4">
                    <ChatInput
                      value={chatInput}
                      onChange={setChatInput}
                      onSend={handleSendMessage}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onSubmit={handleCreateChat}
      />
    </div>
  );
};

export default Index;
