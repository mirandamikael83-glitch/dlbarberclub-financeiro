import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const nomeUnico = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

  const blob = await put(nomeUnico, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
