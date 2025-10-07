import { NextResponse } from 'next/server';

export async function GET() {
  const ipRes = await fetch('https://api64.ipify.org?format=json');
  const data = await ipRes.json();
  return NextResponse.json(data);
}
