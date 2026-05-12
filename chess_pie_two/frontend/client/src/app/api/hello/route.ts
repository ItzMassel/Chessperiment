import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const answer = "hello";
    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}