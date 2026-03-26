'use client';

import { useState } from 'react';

interface Inspiration {
  id: number;
  type: 'text' | 'image' | 'link';
  raw_content: string;
  extracted_text?: string;
  tags?: string[];
  source?: string;
  created_at?: string;
  used_count?: number;
}

interface InspirationCardProps {
  inspiration: Inspiration;
  onEdit: (inspiration: Inspiration) => void;
  onDelete: (id: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (inspiration: Inspiration) => void;
}

export default function InspirationCard({
  inspiration,
  onEdit,
  onDelete,
  selectable,
  selected,
  onSelect
}: InspirationCardProps) {
  const [showFull, setShowFull] = useState(false);

  const typeIcon = {
    text: '📝',
    image: '🖼️',
    link: '🔗'
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        selectable
          ? selected
            ? 'border-blue-500 bg-blue-950'
            : 'border-gray-800 bg-gray-900 hover:border-gray-700'
          : 'border-gray-800 bg-gray-900'
      }`}
      onClick={() => selectable && onSelect?.(inspiration)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>{typeIcon[inspiration.type]}</span>
          <span className="text-sm text-gray-500">
            {new Date(inspiration.created_at || '').toLocaleDateString('zh-CN')}
          </span>
          {inspiration.used_count !== undefined && inspiration.used_count > 0 && (
            <span className="text-xs text-gray-600">已使用 {inspiration.used_count} 次</span>
          )}
        </div>
        {!selectable && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(inspiration)}
              className="text-sm text-gray-500 hover:text-blue-400"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(inspiration.id)}
              className="text-sm text-gray-500 hover:text-red-400"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {inspiration.source && (
        <p className="text-xs text-gray-500 mt-1">来源: {inspiration.source}</p>
      )}

      <div className="mt-3">
        {inspiration.extracted_text ? (
          <p className={`text-sm text-gray-300 ${!showFull && 'line-clamp-3'}`}>
            {inspiration.extracted_text}
          </p>
        ) : (
          <p className={`text-sm text-gray-600 ${!showFull && 'line-clamp-2'}`}>
            {inspiration.raw_content}
          </p>
        )}
      </div>

      {inspiration.tags && inspiration.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {inspiration.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 text-xs bg-gray-800 rounded-full text-gray-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      {(inspiration.extracted_text?.length || 0) > 150 && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="text-xs text-blue-400 mt-2 hover:text-blue-300"
        >
          {showFull ? '收起' : '展开'}
        </button>
      )}
    </div>
  );
}
