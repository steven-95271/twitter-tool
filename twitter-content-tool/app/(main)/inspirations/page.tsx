'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import InspirationCard from '@/components/InspirationCard';

interface LinkItem {
  url: string;
  title?: string;
}

interface FileItem {
  name: string;
  type: string;
  content?: string;
}

interface Inspiration {
  id: number;
  raw_content: string;
  extracted_text?: string;
  tags?: string[];
  source?: string;
  attachments?: {
    images: string[];
    links: { url: string; title?: string }[];
    files: { name: string; type: string; content?: string }[];
  };
  created_at?: string;
  used_count?: number;
}

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;

export default function InspirationsPage() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawContent, setRawContent] = useState('');
  const [source, setSource] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (fileList: FileList | null) => {
    if (!fileList) return;

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;

      if (file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name} 超过12MB限制`);
        continue;
      }

      const base64 = await convertFileToBase64(file);
      setImages(prev => [...prev, base64]);
    }
  };

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    const url = linkInputRef.current?.value.trim();
    if (url) {
      setLinks(prev => [...prev, { url }]);
      if (linkInputRef.current) linkInputRef.current.value = '';
    }
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handlePdfUpload = async (fileList: FileList | null) => {
    if (!fileList) return;

    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf') continue;

      if (file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name} 超过12MB限制`);
        continue;
      }

      const base64 = await convertFileToBase64(file);

      try {
        const res = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf: base64, name: file.name }),
        });
        const data = await res.json();
        setFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          content: (data.text || '').slice(0, 10000),
        }]);
      } catch (error) {
        console.error('Failed to extract PDF text:', error);
        alert(`提取 ${file.name} 失败`);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!rawContent.trim()) {
      alert('请输入灵感文字');
      return;
    }

    setSaving(true);
    try {
      const attachments = {
        images,
        links,
        files,
      };

      const res = await fetch('/api/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent, source, attachments }),
      });

      if (res.ok) {
        setRawContent('');
        setSource('');
        setImages([]);
        setLinks([]);
        setFiles([]);
        fetchInspirations();
      } else {
        const error = await res.json();
        alert(error.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败');
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
          raw_content: inspiration.raw_content,
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
        <h2 className="text-lg font-semibold mb-4">添加灵感</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">灵感文字（必填）</label>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="输入你的灵感..."
            className="w-full h-32 p-3 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">附件材料（可选）</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm flex items-center gap-2"
            >
              <span>🖼️</span> 添加图片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
            />

            <button
              onClick={() => linkInputRef.current?.focus()}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm flex items-center gap-2"
            >
              <span>🔗</span> 添加链接
            </button>

            <button
              onClick={() => pdfInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm flex items-center gap-2"
            >
              <span>📄</span> 添加附件
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => handlePdfUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {images.length > 0 && (
          <div className="mb-4">
            <div
              onDrop={handleImageDrop}
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              className={`p-4 border-2 border-dashed rounded-lg ${isDragging ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700'}`}
            >
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={img} alt={`Upload ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-600 rounded flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-400"
                >
                  <span className="text-xl">+</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
                  <span className="text-sm text-gray-300 truncate max-w-xs">{link.title || link.url}</span>
                  <button
                    onClick={() => removeLink(index)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
                  <span className="text-sm text-gray-300">📄 {file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            ref={linkInputRef}
            type="text"
            placeholder="输入链接后按回车添加"
            className="flex-1 p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLink();
              }
            }}
          />
          <button
            onClick={handleAddLink}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
          >
            添加链接
          </button>
        </div>

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
            disabled={saving || !rawContent.trim()}
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
              value={editingInspiration.raw_content || ''}
              onChange={(e) =>
                setEditingInspiration({
                  ...editingInspiration,
                  raw_content: e.target.value,
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
