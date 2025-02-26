import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  try {
    // 这里可以根据日期获取历史题目
    // 目前返回模拟数据
    return NextResponse.json({
      date: params.date,
      word: "测试", // 实际应用中这里应该是加密的或者有其他保护机制
      totalGuesses: 150,
      averageAttempts: 8.5,
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: '获取历史数据时出错' },
      { status: 500 }
    );
  }
} 