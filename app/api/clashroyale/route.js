import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const playerTag = searchParams.get('tag');
  const token = process.env.CLASH_ROYALE_TOKEN; // Pon tu token en .env.local

  if (!playerTag) {
    return NextResponse.json({ error: 'Missing player tag' }, { status: 400 });
  }

  const res = await fetch(`https://api.clashroyale.com/v1/players/%23${playerTag}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}