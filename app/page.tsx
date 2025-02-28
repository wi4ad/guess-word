'use client';

import { useState, useEffect } from "react";
import Image from "next/image";

interface GuessRecord {
  word: string;
  similarity: number;
  timestamp: number;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning';
  id: number;
}

export default function Home() {
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const [guess, setGuess] = useState("");
  const [guessCount, setGuessCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [isCorrect, setIsCorrect] = useState(false);
  const [guessHistory, setGuessHistory] = useState<GuessRecord[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // 保存猜词记录到localStorage
  const saveGuessHistory = (date: string, history: GuessRecord[]) => {
    localStorage.setItem(`guessHistory_${date}`, JSON.stringify(history));
  };

  // 加载历史记录
  const loadGuessHistory = (date: Date) => {
    const dateStr = formatDate(date).replace(/-/g, "");
    const savedHistory = localStorage.getItem(`guessHistory_${dateStr}`);
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setGuessHistory(history.sort((a: GuessRecord, b: GuessRecord) => b.similarity - a.similarity));
      setGuessCount(history.length);
      setIsCorrect(history.some((record: GuessRecord) => record.similarity === 1));
    } else {
      setGuessCount(0);
      setIsCorrect(false);
      setGuessHistory([]);
    }
  };

  // 在客户端加载初始历史记录
  useEffect(() => {
    loadGuessHistory(selectedDate);
  }, []);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const handleGuess = async () => {
    if (!guess) return;
    
    // 检查是否已经猜过这个词
    if (guessHistory.some(record => record.word === guess)) {
      showToast('你已经猜过这个词了，请换一个试试！', 'warning');
      return;
    }
    
    try {
      const date = formatDate(selectedDate).replace(/-/g, "");
      const encodedWord = encodeURIComponent(guess);
      const response = await fetch(
        `https://xiaoce.fun/api/v0/quiz/daily/GuessWord/guess?date=${date}&word=${encodedWord}`,
        {
          method: "GET",
          headers: {
            "accept": "*/*",
            "cache-control": "no-cache",
            "pragma": "no-cache"
          },
          credentials: "include"
        }
      );
      
      const data = await response.json();
      const newRecord: GuessRecord = {
        word: guess,
        similarity: data.doubleScore,
        timestamp: Date.now()
      };
      
      setIsCorrect(data.correct);
      setGuessCount(prev => prev + 1);
      
      // 更新历史记录并按相似度排序
      const updatedHistory = [...guessHistory, newRecord].sort((a, b) => b.similarity - a.similarity);
      setGuessHistory(updatedHistory);
      
      // 保存到localStorage
      saveGuessHistory(date, updatedHistory);
      
      setGuess("");

      if (data.correct) {
        showToast('恭喜你猜对了！');
      }
    } catch (error) {
      console.error("Error making guess:", error);
      showToast('猜测时出错，请稍后再试', 'error');
    }
  };

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
    setShowDatePicker(false);
    loadGuessHistory(newDate);
  };

  // 根据相似度获取颜色
  const getColorsByScore = (score: number) => {
    if (score === 1) return {
      bg: 'bg-green-100',
      bar: 'bg-green-500',
      text: 'text-green-700'
    };
    if (score >= 0.7) return {
      bg: 'bg-blue-50',
      bar: 'bg-blue-500',
      text: 'text-blue-700'
    };
    if (score >= 0.4) return {
      bg: 'bg-yellow-50',
      bar: 'bg-yellow-500',
      text: 'text-yellow-700'
    };
    return {
      bg: 'bg-red-50',
      bar: 'bg-red-500',
      text: 'text-red-700'
    };
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Toast 通知 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-white font-medium transition-all duration-500 ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <header className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-orange-500">炒饭小测验</h1>
        <div className="flex gap-4">
          <div className="relative">
            <button 
              className="p-2 rounded-full bg-gray-100"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Image
                src="/calendar.svg"
                alt="日历"
                width={24}
                height={24}
                className="opacity-50"
              />
            </button>
            {showDatePicker && (
              <div 
                className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">选择日期</span>
                    <span
                      onClick={() => setShowDatePicker(false)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer p-1"
                    >
                      ✕
                    </span>
                  </div>
                  <input
                    type="date"
                    value={formatDate(selectedDate)}
                    max={formatDate(new Date())}
                    onChange={(e) => handleDateSelect(new Date(e.target.value))}
                    className="p-2 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
          <button className="p-2 rounded-full bg-gray-100">
            <Image
              src="/shopping-cart.svg"
              alt="购物车"
              width={24}
              height={24}
              className="opacity-50"
            />
          </button>
          <button className="p-2 rounded-full bg-gray-100">
            <Image
              src="/user.svg"
              alt="用户"
              width={24}
              height={24}
              className="opacity-50"
            />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">每日挑战 - 猜词</h2>
          <p className="text-gray-500 mb-2">用最少的次数猜到一个隐藏词语</p>
          <p className="text-sm text-gray-400 mb-8">
            {formatDate(selectedDate) === formatDate(new Date()) 
              ? "今日题目" 
              : `${formatDate(selectedDate)} 的题目`}
          </p>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isFocused && !isCorrect && guess) {
                handleGuess();
              }
            }}
            placeholder="任意猜一个词汇......"
            className="flex-1 p-3 border rounded-lg"
            disabled={isCorrect}
          />
          <button
            onClick={handleGuess}
            className={`px-6 py-3 rounded-lg ${
              isCorrect 
                ? "bg-green-500 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
            disabled={isCorrect}
          >
            {isCorrect ? "已完成" : "猜测"}
          </button>
        </div>

        <p className="text-center text-gray-500 mb-4">已猜 {guessCount} 次</p>

        {/* 历史记录展示 */}
        <div className="space-y-2 mb-6">
          {guessHistory.map(record => {
            const colors = getColorsByScore(record.similarity);
            return (
              <div 
                key={record.timestamp}
                className={`relative overflow-hidden ${colors.bg} rounded-lg`}
              >
                <div 
                  className={`absolute top-0 left-0 h-full ${colors.bar} opacity-20 transition-all duration-500`}
                  style={{ width: `${record.similarity * 100}%` }}
                />
                <div className="relative p-4">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${colors.text}`}>{record.word}</span>
                    <span className={`${colors.text}`}>
                      {(record.similarity * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <span className="p-2 rounded-full bg-gray-100">
              <Image
                src="/question.svg"
                alt="问号"
                width={20}
                height={20}
                className="opacity-50"
              />
            </span>
            怎么玩？
          </h3>
          <div className="text-gray-600 space-y-2">
            <p>您有无限机会来尝试猜出一个中文词汇。</p>
            <p>百分比代表和目标词汇的关联程度，越大关联性越高。</p>
            <p>每次尝试后，你可以看到本次猜测与正确答案的关联程度。</p>
            <p>如果是0.0000%，说明你猜测的这个词不在我们的语料库中......</p>
            <p>渐入佳境了！再试试「测验」呢？</p>
          </div>
        </div>
      </main>
    </div>
  );
}
