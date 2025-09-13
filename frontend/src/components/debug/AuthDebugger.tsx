'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../stores/authStore';

/**
 * 认证调试组件 - 显示当前认证状态的详细信息
 */
export default function AuthDebugger() {
  const { user, isAuthenticated, isLoading, error, checkAuth } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<{
    accessToken: string | null;
    user: string | null;
    authStorage: string | null;
  }>({
    accessToken: null,
    user: null,
    authStorage: null
  });

  // 获取 localStorage 数据
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageData({
        accessToken: localStorage.getItem('accessToken'),
        user: localStorage.getItem('user'),
        authStorage: localStorage.getItem('auth-storage')
      });
    }
  }, []);

  const handleClearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage');
    window.location.reload();
  };

  const handleManualCheckAuth = async () => {
    try {
      await checkAuth();
    } catch (error) {
      console.error('Manual checkAuth error:', error);
    }
  };

  return (
    <div className="fixed top-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-3">🐛 认证状态调试</h3>
      
      {/* Zustand Store 状态 */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Zustand Store 状态:</h4>
        <div className="bg-gray-50 p-2 rounded text-sm">
          <div><strong>isLoading:</strong> <span className={isLoading ? 'text-orange-600' : 'text-green-600'}>{String(isLoading)}</span></div>
          <div><strong>isAuthenticated:</strong> <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{String(isAuthenticated)}</span></div>
          <div><strong>user:</strong> <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? user.email : 'null'}</span></div>
          <div><strong>error:</strong> <span className={error ? 'text-red-600' : 'text-green-600'}>{error || 'null'}</span></div>
        </div>
      </div>

      {/* localStorage 状态 */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">localStorage 状态:</h4>
        <div className="bg-gray-50 p-2 rounded text-sm">
          <div><strong>accessToken:</strong> 
            <span className={localStorageData.accessToken ? 'text-green-600' : 'text-red-600'}>
              {localStorageData.accessToken ? `${localStorageData.accessToken.substring(0, 20)}...` : 'null'}
            </span>
          </div>
          <div><strong>user:</strong> 
            <span className={localStorageData.user ? 'text-green-600' : 'text-red-600'}>
              {localStorageData.user ? 'exists' : 'null'}
            </span>
          </div>
          <div><strong>auth-storage:</strong> 
            <span className={localStorageData.authStorage ? 'text-green-600' : 'text-red-600'}>
              {localStorageData.authStorage ? 'exists' : 'null'}
            </span>
          </div>
        </div>
      </div>

      {/* 用户详细信息 */}
      {user && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">用户信息:</h4>
          <div className="bg-gray-50 p-2 rounded text-sm">
            <div><strong>ID:</strong> {user.id}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Name:</strong> {user.name}</div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleManualCheckAuth}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          手动检查认证
        </button>
        <button
          onClick={handleClearAuth}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          清除认证数据
        </button>
      </div>
    </div>
  );
}
