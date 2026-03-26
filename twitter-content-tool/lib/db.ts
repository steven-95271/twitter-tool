import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = process.env.DATABASE_PATH 
  ? path.dirname(process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'twitter-tool.db');

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS inspirations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_content TEXT NOT NULL,
    extracted_text TEXT,
    tags TEXT DEFAULT '[]',
    source TEXT,
    attachments TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    background TEXT,
    tone TEXT,
    style_rules TEXT DEFAULT '[]',
    banned_words TEXT DEFAULT '[]',
    reference_authors TEXT DEFAULT '[]',
    system_prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface InspirationAttachment {
  images: string[];
  links: { url: string; title?: string }[];
  files: { name: string; content?: string; type: string }[];
}

export interface Inspiration {
  id?: number;
  raw_content: string;
  extracted_text?: string;
  tags?: string[];
  source?: string;
  attachments?: InspirationAttachment;
  created_at?: string;
  used_count?: number;
}

export interface Persona {
  id?: number;
  name: string;
  handle: string;
  background?: string | null;
  tone?: string | null;
  style_rules?: string[];
  banned_words?: string[];
  reference_authors?: ReferenceAuthor[];
  system_prompt?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReferenceAuthor {
  name: string;
  style_notes: string;
  sample_tweets: string[];
}

interface InspirationRow {
  id: number;
  raw_content: string;
  extracted_text: string | null;
  tags: string;
  source: string | null;
  attachments: string;
  created_at: string;
  used_count: number;
}

interface PersonaRow {
  id: number;
  name: string;
  handle: string;
  background: string | null;
  tone: string | null;
  style_rules: string;
  banned_words: string;
  reference_authors: string;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export const inspirationDb = {
  create(inspiration: Omit<Inspiration, 'id' | 'created_at' | 'used_count'>) {
    const stmt = db.prepare(`
      INSERT INTO inspirations (raw_content, extracted_text, tags, source, attachments)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      inspiration.raw_content,
      inspiration.extracted_text || null,
      JSON.stringify(inspiration.tags || []),
      inspiration.source || null,
      JSON.stringify(inspiration.attachments || { images: [], links: [], files: [] })
    );
    return result.lastInsertRowid;
  },

  getAll() {
    const stmt = db.prepare('SELECT * FROM inspirations ORDER BY created_at DESC');
    const rows = stmt.all() as InspirationRow[];
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      attachments: JSON.parse(row.attachments || '{"images":[],"links":[],"files":[]}')
    }));
  },

  getById(id: number) {
    const stmt = db.prepare('SELECT * FROM inspirations WHERE id = ?');
    const row = stmt.get(id) as InspirationRow | undefined;
    if (!row) return null;
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      attachments: JSON.parse(row.attachments || '{"images":[],"links":[],"files":[]}')
    };
  },

  update(id: number, inspiration: Partial<Inspiration>) {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (inspiration.raw_content !== undefined) { fields.push('raw_content = ?'); values.push(inspiration.raw_content); }
    if (inspiration.extracted_text !== undefined) { fields.push('extracted_text = ?'); values.push(inspiration.extracted_text); }
    if (inspiration.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(inspiration.tags)); }
    if (inspiration.source !== undefined) { fields.push('source = ?'); values.push(inspiration.source); }
    if (inspiration.attachments !== undefined) { fields.push('attachments = ?'); values.push(JSON.stringify(inspiration.attachments)); }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE inspirations SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  },

  delete(id: number) {
    const stmt = db.prepare('DELETE FROM inspirations WHERE id = ?');
    stmt.run(id);
  },

  incrementUsedCount(id: number) {
    const stmt = db.prepare('UPDATE inspirations SET used_count = used_count + 1 WHERE id = ?');
    stmt.run(id);
  }
};

export const personaDb = {
  create(persona: Omit<Persona, 'id' | 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
      INSERT INTO personas (name, handle, background, tone, style_rules, banned_words, reference_authors, system_prompt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      persona.name,
      persona.handle,
      persona.background || null,
      persona.tone || null,
      JSON.stringify(persona.style_rules || []),
      JSON.stringify(persona.banned_words || []),
      JSON.stringify(persona.reference_authors || []),
      persona.system_prompt || null
    );
    return result.lastInsertRowid;
  },

  getAll() {
    const stmt = db.prepare('SELECT * FROM personas ORDER BY created_at DESC');
    const rows = stmt.all() as PersonaRow[];
    return rows.map(row => ({
      ...row,
      style_rules: JSON.parse(row.style_rules || '[]'),
      banned_words: JSON.parse(row.banned_words || '[]'),
      reference_authors: JSON.parse(row.reference_authors || '[]')
    }));
  },

  getById(id: number) {
    const stmt = db.prepare('SELECT * FROM personas WHERE id = ?');
    const row = stmt.get(id) as PersonaRow | undefined;
    if (!row) return null;
    return {
      ...row,
      style_rules: JSON.parse(row.style_rules || '[]'),
      banned_words: JSON.parse(row.banned_words || '[]'),
      reference_authors: JSON.parse(row.reference_authors || '[]')
    };
  },

  update(id: number, persona: Partial<Persona>) {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (persona.name !== undefined) { fields.push('name = ?'); values.push(persona.name); }
    if (persona.handle !== undefined) { fields.push('handle = ?'); values.push(persona.handle); }
    if (persona.background !== undefined) { fields.push('background = ?'); values.push(persona.background); }
    if (persona.tone !== undefined) { fields.push('tone = ?'); values.push(persona.tone); }
    if (persona.style_rules !== undefined) { fields.push('style_rules = ?'); values.push(JSON.stringify(persona.style_rules)); }
    if (persona.banned_words !== undefined) { fields.push('banned_words = ?'); values.push(JSON.stringify(persona.banned_words)); }
    if (persona.reference_authors !== undefined) { fields.push('reference_authors = ?'); values.push(JSON.stringify(persona.reference_authors)); }
    if (persona.system_prompt !== undefined) { fields.push('system_prompt = ?'); values.push(persona.system_prompt); }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const stmt = db.prepare(`UPDATE personas SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  },

  delete(id: number) {
    const stmt = db.prepare('DELETE FROM personas WHERE id = ?');
    stmt.run(id);
  }
};

export default db;
