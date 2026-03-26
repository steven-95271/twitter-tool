import { NextRequest, NextResponse } from 'next/server';
import { personaDb, Persona } from '@/lib/db';

export async function GET() {
  try {
    const personas = personaDb.getAll();
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = personaDb.create(body as Omit<Persona, 'id' | 'created_at' | 'updated_at'>);
    const persona = personaDb.getById(Number(id));
    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    personaDb.update(Number(id), updates);
    const persona = personaDb.getById(Number(id));
    return NextResponse.json(persona);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    personaDb.delete(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 });
  }
}
