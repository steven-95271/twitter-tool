import { NextRequest, NextResponse } from 'next/server';
import { inspirationDb, Inspiration } from '@/lib/db';

export async function GET() {
  try {
    const inspirations = inspirationDb.getAll();
    return NextResponse.json(inspirations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspirations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = inspirationDb.create(body as Omit<Inspiration, 'id' | 'created_at' | 'used_count'>);
    const inspiration = inspirationDb.getById(Number(id));
    return NextResponse.json(inspiration, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inspiration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    inspirationDb.update(Number(id), updates);
    const inspiration = inspirationDb.getById(Number(id));
    return NextResponse.json(inspiration);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inspiration' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    inspirationDb.delete(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inspiration' }, { status: 500 });
  }
}
