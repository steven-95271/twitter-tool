'use client';

import { useState } from 'react';

interface TweetPreviewProps {
  tweets: string[];
  onRegenerate: (index: number) => void;
  onMarkUsed: () => void;
  onCopy: (tweet: string) => void;
}

export default function TweetPreview({ tweets, onRegenerate, onMarkUsed, onCopy }: TweetPreviewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (tweet: string, index: number) => {
    onCopy(tweet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (tweets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>点击「生成推文」开始创作</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tweets.map((tweet, index) => (
        <div key={index} className="p-4 rounded-lg border border-gray-800 bg-gray-900">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{tweet}</p>
          <p className="text-xs text-gray-600 mt-2">{tweet.length} 字</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => handleCopy(tweet, index)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {copiedIndex === index ? '已复制!' : '复制'}
            </button>
            <button
              onClick={() => onRegenerate(index)}
              className="text-sm text-gray-500 hover:text-gray-400"
            >
              重新生成
            </button>
            {index === tweets.length - 1 && (
              <button
                onClick={onMarkUsed}
                className="text-sm text-green-500 hover:text-green-400"
              >
                标记为已使用
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
