"use client";

export default function WelcomeSection() {
  return (
    <div className="text-center mb-12">
      <h1 className="text-5xl font-bold mb-4 text-black">
        Reddit Sentiment Analyzer
      </h1>
      <p className="text-xl text-zinc-500">
        Discover what people are saying on Reddit
      </p>
      <p className="text-sm text-zinc-400 mt-2">
        AI-powered sentiment analysis for any subreddit and topic using fine-tuned BERT models
      </p>
      <div className="mt-6 flex justify-center gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-500"></span>
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Negative</span>
        </div>
      </div>
    </div>
  );
}
