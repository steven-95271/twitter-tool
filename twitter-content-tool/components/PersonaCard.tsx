'use client';

import Link from 'next/link';

interface Persona {
  id: number;
  name: string;
  handle: string;
  background?: string;
  tone?: string;
  style_rules?: string[];
  banned_words?: string[];
  reference_authors?: { name: string }[];
  created_at?: string;
}

interface PersonaCardProps {
  persona: Persona;
  onDelete: (id: number) => void;
}

export default function PersonaCard({ persona, onDelete }: PersonaCardProps) {
  return (
    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{persona.name}</h3>
          <p className="text-sm text-gray-500">{persona.handle}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/personas/${persona.id}`}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            编辑
          </Link>
          <button
            onClick={() => onDelete(persona.id)}
            className="text-sm text-gray-500 hover:text-red-400"
          >
            删除
          </button>
        </div>
      </div>

      {persona.tone && (
        <p className="mt-3 text-sm text-gray-400">
          <span className="text-gray-500">语气:</span> {persona.tone}
        </p>
      )}

      {persona.background && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {persona.background}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mt-3">
        {persona.style_rules?.slice(0, 3).map((rule, i) => (
          <span key={i} className="px-2 py-0.5 text-xs bg-gray-800 rounded text-gray-400">
            {rule.length > 20 ? rule.slice(0, 20) + '...' : rule}
          </span>
        ))}
        {persona.style_rules && persona.style_rules.length > 3 && (
          <span className="px-2 py-0.5 text-xs text-gray-600">
            +{persona.style_rules.length - 3} 更多
          </span>
        )}
      </div>

      {persona.reference_authors && persona.reference_authors.length > 0 && (
        <p className="mt-2 text-xs text-gray-600">
          参考: {persona.reference_authors.map(a => a.name).join(', ')}
        </p>
      )}
    </div>
  );
}
