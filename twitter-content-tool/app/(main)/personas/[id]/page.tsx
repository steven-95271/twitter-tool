'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { buildSystemPrompt } from '@/lib/prompt-builder';

interface ReferenceAuthor {
  name: string;
  style_notes: string;
  sample_tweets: string[];
}

interface Persona {
  id: number;
  name: string;
  handle: string;
  background?: string;
  tone?: string;
  style_rules?: string[];
  banned_words?: string[];
  reference_authors?: ReferenceAuthor[];
  system_prompt?: string;
}

export default function PersonaEditPage() {
  const params = useParams();
  const router = useRouter();
  const [persona, setPersona] = useState<Partial<Persona>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState('');

  const fetchPersona = useCallback(async () => {
    try {
      const res = await fetch(`/api/personas`);
      const data = await res.json();
      const found = data.find((p: Persona) => p.id === Number(params.id));
      if (found) {
        setPersona(found);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPersona();
  }, [fetchPersona]);

  const handleSave = async () => {
    if (!persona.name || !persona.handle) return;

    setSaving(true);
    try {
      await fetch('/api/personas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      });
      router.push('/personas');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePrompt = () => {
    const prompt = buildSystemPrompt(persona as Persona);
    setPreviewPrompt(prompt);
    setShowPreview(true);
  };

  const addReferenceAuthor = () => {
    setPersona({
      ...persona,
      reference_authors: [
        ...(persona.reference_authors || []),
        { name: '', style_notes: '', sample_tweets: [] },
      ],
    });
  };

  const updateReferenceAuthor = (index: number, field: keyof ReferenceAuthor, value: string | string[]) => {
    const authors = [...(persona.reference_authors || [])];
    authors[index] = { ...authors[index], [field]: value };
    setPersona({ ...persona, reference_authors: authors });
  };

  const removeReferenceAuthor = (index: number) => {
    const authors = [...(persona.reference_authors || [])];
    authors.splice(index, 1);
    setPersona({ ...persona, reference_authors: authors });
  };

  if (loading) {
    return (
      <p className="text-gray-500">加载中...</p>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">编辑人设</h1>
        <button
          onClick={handleGeneratePrompt}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
        >
          生成 System Prompt
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">名称</label>
            <input
              type="text"
              value={persona.name || ''}
              onChange={(e) => setPersona({ ...persona, name: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Twitter Handle</label>
            <input
              type="text"
              value={persona.handle || ''}
              onChange={(e) => setPersona({ ...persona, handle: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">背景描述</label>
          <textarea
            value={persona.background || ''}
            onChange={(e) => setPersona({ ...persona, background: e.target.value })}
            className="w-full h-24 p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">语气风格</label>
          <input
            type="text"
            value={persona.tone || ''}
            onChange={(e) => setPersona({ ...persona, tone: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">写作规则（每行一条）</label>
          <textarea
            value={persona.style_rules?.join('\n') || ''}
            onChange={(e) =>
              setPersona({
                ...persona,
                style_rules: e.target.value.split('\n').filter(Boolean),
              })
            }
            className="w-full h-32 p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">禁用词（逗号分隔）</label>
          <input
            type="text"
            value={persona.banned_words?.join(', ') || ''}
            onChange={(e) =>
              setPersona({
                ...persona,
                banned_words: e.target.value.split(',').map((t) => t.trim()),
              })
            }
            className="w-full p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">参考博主</label>
            <button
              onClick={addReferenceAuthor}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + 添加博主
            </button>
          </div>
          {persona.reference_authors?.map((author, index) => (
            <div key={index} className="p-4 mb-3 rounded-lg bg-gray-900 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={author.name}
                  onChange={(e) => updateReferenceAuthor(index, 'name', e.target.value)}
                  placeholder="博主名称"
                  className="flex-1 p-2 mr-2 rounded bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => removeReferenceAuthor(index)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  删除
                </button>
              </div>
              <input
                type="text"
                value={author.style_notes}
                onChange={(e) => updateReferenceAuthor(index, 'style_notes', e.target.value)}
                placeholder="风格特点描述"
                className="w-full p-2 mb-2 rounded bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={author.sample_tweets.join('\n')}
                onChange={(e) =>
                  updateReferenceAuthor(index, 'sample_tweets', e.target.value.split('\n').filter(Boolean))
                }
                placeholder="示例推文（每行一条）"
                className="w-full h-20 p-2 rounded bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
        </div>

        {persona.system_prompt && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">自定义 System Prompt</label>
            <textarea
              value={persona.system_prompt}
              onChange={(e) => setPersona({ ...persona, system_prompt: e.target.value })}
              className="w-full h-40 p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => router.push('/personas')}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !persona.name || !persona.handle}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-3xl max-h-screen overflow-auto">
            <h3 className="text-lg font-semibold mb-4">System Prompt 预览</h3>
            <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-gray-950 p-4 rounded-lg overflow-auto max-h-96">
              {previewPrompt}
            </pre>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setPersona({ ...persona, system_prompt: previewPrompt });
                  setShowPreview(false);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                使用此 Prompt
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
