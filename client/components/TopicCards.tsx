"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { TrendingUp, Smartphone, Gamepad2 } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  exampleQuery: string;
}

interface TopicCardsProps {
  onTopicClick: (topicId: string) => void;
}

export default function TopicCards({ onTopicClick }: TopicCardsProps) {
  const topics: Topic[] = [
    {
      id: "1",
      title: "Apple Products",
      description: "What is the sentiment on r/apple about the iPhone 16?",
      icon: Smartphone,
      color: "bg-gray-400",
      exampleQuery: "What is the sentiment on r/apple about the iPhone 16?",
    },
    {
      id: "2",
      title: "Gaming",
      description: "What is the sentiment on r/gaming about the PS5 Pro?",
      icon: Gamepad2,
      color: "bg-purple-400",
      exampleQuery: "What is the sentiment on r/gaming about the PS5 Pro?",
    },
    {
      id: "3",
      title: "Technology",
      description: "What is the sentiment on r/technology about AI?",
      icon: TrendingUp,
      color: "bg-blue-400",
      exampleQuery: "What is the sentiment on r/technology about AI?",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {topics.map((topic) => {
        const IconComponent = topic.icon;
        return (
          <Card
            key={topic.id}
            className="cursor-pointer hover:shadow-lg transition-shadow hover:border-zinc-400"
            onClick={() => onTopicClick(topic.id)}
          >
            <CardContent className="p-6">
              <div
                className={`w-12 h-12 ${topic.color} rounded-lg flex items-center justify-center mb-4`}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg mb-2">{topic.title}</CardTitle>
              <CardDescription className="text-sm">
                {topic.description}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
