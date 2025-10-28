"use client";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { BookOpen, Globe, Code } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TopicCardsProps {
  onTopicClick: (topicId: string) => void;
}

export default function TopicCards({ onTopicClick }: TopicCardsProps) {
  const topics: Topic[] = [
    {
      id: "1",
      title: "Legal Insights",
      description: "Explore the latest updates and key discussions on legal topics today.",
      icon: BookOpen,
      color: "bg-yellow-400",
    },
    {
      id: "2",
      title: "Global Justice",
      description: "Discover important trends and changes shaping international law.",
      icon: Globe,
      color: "bg-green-400",
    },
    {
      id: "3",
      title: "Modern Law & Technology",
      description: "Explore the latest updates and key discussions on legal topics today.",
      icon: Code,
      color: "bg-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {topics.map((topic) => {
        const IconComponent = topic.icon;
        return (
          <Card
            key={topic.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onTopicClick(topic.id)}
          >
            <CardContent className="p-6">
              <div
                className={`w-12 h-12 ${topic.color} rounded-lg flex items-center justify-center mb-4`}
              >
                <IconComponent className="w-6 h-6 text-zinc-900" />
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
