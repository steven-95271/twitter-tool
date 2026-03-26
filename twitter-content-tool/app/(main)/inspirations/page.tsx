'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import InspirationCard from '@/components/InspirationCard';

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

export default function InspirationsPage() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputType, setInputType] = useState<'text' | 'image' | 'link'>('text');
  const [rawContent, setRawContent] = useState('');
  const [source, setSource] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInspirations();
  }, []);

  const fetchInspirations = async () => {
    try {
      const res = await fetch('/api/inspirations');
      const data = await res.json();
      setInspirations(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (file: File) => {
    const base64 = await convertFileToBase64(file);
    setImageBase64(base64);
    setRawContent(base64);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = async () => {
    if (inputType === 'image' && !imageBase64) {
      alert('请先上传图片');
      return;
    }
    if (inputType !== 'image' && !rawContent.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent, type: inputType, source }),
      });

      if (res.ok) {
        setRawContent('');
        setSource('');
        setImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchInspirations();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (inspiration: Inspiration) => {
    try {
      await fetch('/api/inspirations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inspiration.id,
          extracted_text: inspiration.extracted_text,
          tags: inspiration.tags,
          source: inspiration.source,
        }),
      });
      setEditingInspiration(null);
      fetchInspirations();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条灵感吗？')) return;
    try {
      await fetch(`/api/inspirations?id=${id}`, { method: 'DELETE' });
      fetchInspirations();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">灵感收集</h1>

      <div className="mb-8 p-6 rounded-lg border border-gray-800 bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">添加新灵感</h2>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => { setInputType('text'); setImageBase64(null); }}
            className={`px-4 py-2 rounded-lg ${
              inputType === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            文字
          </button>
          <button
            onClick={() => { setInputType('image'); setImageBase64(null); }}
            className={`px-4 py-2 rounded-lg ${
              inputType === 'image'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            图片
          </button>
          <button
            onClick={() => { setInputType('link'); setImageBase64(null); }}
            className={`px-4 py-2 rounded-lg ${
              inputType === 'link'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            链接
          </button>
        </div>

        {inputType === 'image' ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            {imageBase64 ? (
              <div className="relative w-full h-full p-2">
                <img src={imageBase64} alt="Preview" className="w-full h-full object-contain rounded" />
                <p className="text-center text-sm text-gray-400 mt-2">点击或拖拽更换图片</p>
              </div>
            ) : (
              <>
                <span className="text-4xl mb-2">🖼️</span>
                <p className="text-gray-400">拖拽图片到此处，或点击选择</p>
                <p className="text-xs text-gray-600 mt-1">支持 JPG, PNG, GIF 格式</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder={inputType === 'link' ? '粘贴链接...' : '输入文字内容...'}
            className="w-full h-32 p-3 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        )}

        <div className="mt-4 flex gap-4">
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="来源（可选，如：Wolfram的书）"
            className="flex-1 p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={saving || (inputType === 'image' ? !imageBase64 : !rawContent.trim())}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存并分析...' : '保存并分析'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : inspirations.length === 0 ? (
        <p className="text-gray-500 text-center py-8">还没有灵感，添加第一条吧</p>
      ) : (
        <div className="space-y-4">
          {inspirations.map((inspiration) => (
            <InspirationCard
              key={inspiration.id}
              inspiration={inspiration}
              onEdit={setEditingInspiration}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingInspiration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">编辑灵感</h3>
            <textarea
              value={editingInspiration.extracted_text || ''}
              onChange={(e) =>
                setEditingInspiration({
                  ...editingInspiration,
                  extracted_text: e.target.value,
                })
              }
              className="w-full h-32 p-3 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
            />
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={editingInspiration.tags?.join(', ') || ''}
                onChange={(e) =>
                  setEditingInspiration({
                    ...editingInspiration,
                    tags: e.target.value.split(',').map((t) => t.trim()),
                  })
                }
                placeholder="标签（逗号分隔）"
                className="flex-1 p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setEditingInspiration(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => handleUpdate(editingInspiration)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
