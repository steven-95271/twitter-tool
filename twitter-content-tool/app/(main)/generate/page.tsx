'use client';

import { useState, useEffect } from 'react';
import InspirationCard from '@/components/InspirationCard';
import TweetPreview from '@/components/TweetPreview';

interface Persona {
  id: number;
  name: string;
  handle: string;
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

export default function GeneratePage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [selectedInspirationIds, setSelectedInspirationIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [tweets, setTweets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [personasRes, inspirationsRes] = await Promise.all([
        fetch('/api/personas'),
        fetch('/api/inspirations'),
      ]);
      const personasData = await personasRes.json();
      const inspirationsData = await inspirationsRes.json();
      setPersonas(personasData);
      setInspirations(inspirationsData);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPersonaId || selectedInspirationIds.length === 0) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          inspirationIds: selectedInspirationIds,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTweets(data.tweets);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (!selectedPersonaId || selectedInspirationIds.length === 0) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          inspirationIds: selectedInspirationIds,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newTweets = [...tweets];
        newTweets[index] = data.tweets[0];
        setTweets(newTweets);
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkUsed = () => {
    setTweets([]);
    setSelectedInspirationIds([]);
  };

  const handleCopy = (tweet: string) => {
    navigator.clipboard.writeText(tweet);
  };

  const toggleInspiration = (inspiration: Inspiration) => {
    setSelectedInspirationIds((prev) =>
      prev.includes(inspiration.id)
        ? prev.filter((id) => id !== inspiration.id)
        : [...prev, inspiration.id]
    );
  };

  if (loading) {
    return (
      <p className="text-gray-500">加载中...</p>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">生成推文</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">选择人设</label>
            <select
              value={selectedPersonaId || ''}
              onChange={(e) => setSelectedPersonaId(Number(e.target.value) || null)}
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">选择人设...</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name} ({persona.handle})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">补充说明（可选）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="如：结合我做亚马逊的经验来写"
              className="w-full h-24 p-3 rounded-lg bg-gray-900 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedPersonaId || selectedInspirationIds.length === 0}
            className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? '生成中...' : '生成推文'}
          </button>
        </div>

        <div className="lg:col-span-1 border-l border-gray-800 pl-6 max-h-screen overflow-auto">
          <h3 className="text-sm text-gray-400 mb-3">
            选择灵感素材 ({selectedInspirationIds.length} 已选)
          </h3>
          {inspirations.length === 0 ? (
            <p className="text-gray-600 text-sm">还没有灵感素材</p>
          ) : (
            <div className="space-y-3">
              {inspirations.map((inspiration) => (
                <InspirationCard
                  key={inspiration.id}
                  inspiration={inspiration}
                  selectable
                  selected={selectedInspirationIds.includes(inspiration.id)}
                  onSelect={toggleInspiration}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 border-l border-gray-800 pl-6">
          <h3 className="text-sm text-gray-400 mb-3">生成的推文</h3>
          <TweetPreview
            tweets={tweets}
            onRegenerate={handleRegenerate}
            onMarkUsed={handleMarkUsed}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  );
}
