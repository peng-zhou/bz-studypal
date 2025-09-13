'use client';

import React, { useState } from 'react';
import { useAuth } from '../../stores/authStore';
import { useRouter } from 'next/navigation';

/**
 * 快速登录组件 - 仅用于开发测试
 */
export default function QuickLogin() {
  const { login, register, isLoading, error } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleQuickLogin = async () => {
    try {
      await login({
        email: 'test@example.com',
        password: 'password123'
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };

  const handleQuickRegister = async () => {
    try {
      await register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Quick register failed:', error);
    }
  };

  const handleSetTestToken = () => {
    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      preferredLanguage: 'zh',
      createdAt: new Date().toISOString()
    }));
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg z-50">
      <h4 className="font-bold text-yellow-800 mb-2">🧪 开发测试工具</h4>
      <div className="flex flex-col gap-2 text-sm">
        <button
          onClick={handleQuickLogin}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '登录中...' : '快速登录'}
        </button>
        <button
          onClick={handleQuickRegister}
          disabled={isLoading}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? '注册中...' : '快速注册'}
        </button>
        <button
          onClick={handleSetTestToken}
          className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          设置测试令牌
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      <div className="mt-2 text-xs text-yellow-700">
        测试账户: test@example.com / password123
      </div>
    </div>
  );
}
