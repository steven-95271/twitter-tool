import { NextRequest, NextResponse } from 'next/server';
import { personaDb, inspirationDb, Inspiration } from '@/lib/db';
import { generateTweets, extractInspirationContent, suggestTags } from '@/lib/llm';
import { buildSystemPrompt } from '@/lib/prompt-builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personaId, inspirationIds, notes } = body;

    if (!personaId) {
      return NextResponse.json({ error: 'Persona ID is required' }, { status: 400 });
    }

    if (!inspirationIds || inspirationIds.length === 0) {
      return NextResponse.json({ error: 'At least one inspiration is required' }, { status: 400 });
    }

    const persona = personaDb.getById(Number(personaId));
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    const inspirations = inspirationIds.map((id: number) => inspirationDb.getById(id)).filter((insp: Inspiration | null): insp is Inspiration => insp !== null);

    const systemPrompt = persona.system_prompt || buildSystemPrompt(persona);

    const inspirationTexts = inspirations.map((insp: Inspiration) => {
      return `【${insp.type}】${insp.extracted_text || insp.raw_content}`;
    }).join('\n\n');

    const tweets = await generateTweets(systemPrompt, inspirationTexts, notes);

    inspirations.forEach((insp: Inspiration) => {
      inspirationDb.incrementUsedCount(insp.id!);
    });

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Failed to generate tweets' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawContent, type, source } = body;

    const extractedText = await extractInspirationContent(rawContent, type);
    const tags = await suggestTags(extractedText);

    const id = inspirationDb.create({
      type,
      raw_content: rawContent,
      extracted_text: extractedText,
      tags,
      source
    });

    const inspiration = inspirationDb.getById(Number(id));
    return NextResponse.json(inspiration, { status: 201 });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Failed to process inspiration' }, { status: 500 });
  }
}
