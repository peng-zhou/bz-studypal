'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../stores/authStore';
import QuickLogin from '../../components/debug/QuickLogin';

export default function AuthTestPage() {
  const { user, isAuthenticated, isLoading, error, checkAuth, login } = useAuth();
  const [localStorageInfo, setLocalStorageInfo] = useState<any>({});

  useEffect(() => {
    // 在客户端获取 localStorage 信息
    if (typeof window !== 'undefined') {
      setLocalStorageInfo({
        accessToken: localStorage.getItem('accessToken'),
        user: localStorage.getItem('user'),
        authStorage: localStorage.getItem('auth-storage')
      });
    }
  }, []);

  const handleTestLogin = async () => {
    try {
      // 使用测试账户登录
      await login({
        email: 'test@example.com',
        password: 'password123'
      });
    } catch (error) {
      console.error('Test login failed:', error);
    }
  };

  const handleClearAuth = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">认证状态测试页面</h1>
        
        {/* 当前认证状态 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前认证状态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Zustand Store 状态</h3>
              <div className="bg-gray-50 p-3 rounded">
                <div><strong>isLoading:</strong> <span className={isLoading ? 'text-red-600' : 'text-green-600'}>{String(isLoading)}</span></div>
                <div><strong>isAuthenticated:</strong> <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{String(isAuthenticated)}</span></div>
                <div><strong>user:</strong> <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? `${user.name} (${user.email})` : 'null'}</span></div>
                <div><strong>error:</strong> <span className={error ? 'text-red-600' : 'text-green-600'}>{error || 'null'}</span></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">localStorage 内容</h3>
              <div className="bg-gray-50 p-3 rounded">
                <div><strong>accessToken:</strong> {localStorageInfo.accessToken ? '存在' : '不存在'}</div>
                <div><strong>user:</strong> {localStorageInfo.user ? '存在' : '不存在'}</div>
                <div><strong>auth-storage:</strong> {localStorageInfo.authStorage ? '存在' : '不存在'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">操作</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              测试登录
            </button>
            <button
              onClick={() => checkAuth()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              检查认证状态
            </button>
            <button
              onClick={handleClearAuth}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              清除所有认证数据
            </button>
            <a
              href="/auth/login"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 inline-block"
            >
              前往登录页面
            </a>
          </div>
        </div>

        {/* 原始数据显示 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">原始数据</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify({
              user,
              isAuthenticated,
              isLoading,
              error,
              localStorage: localStorageInfo
            }, null, 2)}
          </pre>
        </div>

        {/* Dashboard 链接 */}
        {user && (
          <div className="mt-6">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-block"
            >
              前往 Dashboard
            </a>
          </div>
        )}
      </div>
      <QuickLogin />
    </div>
  );
}
