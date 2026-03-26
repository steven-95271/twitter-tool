'use client';

import { useState, useEffect } from 'react';
import PersonaCard from '@/components/PersonaCard';

interface Persona {
  id: number;
  name: string;
  handle: string;
  background?: string;
  tone?: string;
  style_rules?: string[];
  banned_words?: string[];
  reference_authors?: { name: string; style_notes: string; sample_tweets: string[] }[];
  system_prompt?: string;
  created_at?: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Persona>>({
    name: '',
    handle: '',
    background: '',
    tone: '',
    style_rules: [],
    banned_words: [],
    reference_authors: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const res = await fetch('/api/personas');
      const data = await res.json();
      setPersonas(data);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.handle) return;

    setSaving(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          name: '',
          handle: '',
          background: '',
          tone: '',
          style_rules: [],
          banned_words: [],
          reference_authors: [],
        });
        setShowForm(false);
        fetchPersonas();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个人设吗？')) return;
    try {
      await fetch(`/api/personas?id=${id}`, { method: 'DELETE' });
      fetchPersonas();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(personas, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'personas-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        for (const persona of imported) {
          await fetch('/api/personas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(persona),
          });
        }
        fetchPersonas();
      } catch (error) {
        console.error('Failed to import:', error);
        alert('导入失败');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">人设管理</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
          >
            导出
          </button>
          <label className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm cursor-pointer">
            导入
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            新建人设
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : personas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">还没有人设，创建第一个人设吧</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-2xl my-8">
            <h3 className="text-lg font-semibold mb-4">新建人设</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">名称</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：Steven AI笔记"
                    className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Twitter Handle</label>
                  <input
                    type="text"
                    value={formData.handle || ''}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    placeholder="如：@stevenotes"
                    className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">背景描述</label>
                <textarea
                  value={formData.background || ''}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="描述你的人设背景..."
                  className="w-full h-20 p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">语气风格</label>
                <input
                  type="text"
                  value={formData.tone || ''}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="一句话概括语气，如：专业但不失幽默"
                  className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">写作规则</label>
                <textarea
                  value={formData.style_rules?.join('\n') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      style_rules: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  placeholder="每行一条规则，如：使用短句，不要超长句子"
                  className="w-full h-24 p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">禁用词（逗号分隔）</label>
                <input
                  type="text"
                  value={formData.banned_words?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      banned_words: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                  placeholder="如：绝对，必须，一定"
                  className="w-full p-2 rounded-lg bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    name: '',
                    handle: '',
                    background: '',
                    tone: '',
                    style_rules: [],
                    banned_words: [],
                    reference_authors: [],
                  });
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.handle}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
