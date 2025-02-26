import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();
    
    // 调用猜词API
    const response = await fetch('http://localhost:3000/api/mcp/guess-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ word }),
    });

    const data = await response.json();
    
    return NextResponse.json({
      similarity: data.similarity || 0,
      message: data.message || '猜测成功',
    });
  } catch (error) {
    console.error('Error in guess API:', error);
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    );
  }
} 