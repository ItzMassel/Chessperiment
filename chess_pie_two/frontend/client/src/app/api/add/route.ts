import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { num1, num2 } = body;
    if (typeof num1 !== 'number' || typeof num2 !== 'number') {
      return NextResponse.json(
        { error: 'num1 and num2 must be numbers' },
        { status: 400 }
      );
    }
    const answer = num1 + num2;
    return NextResponse.json({ answer }, { status: 200 })
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}