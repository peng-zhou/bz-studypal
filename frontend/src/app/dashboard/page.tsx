'use client';

import React from 'react';
import { useAuth } from '../../stores/authStore';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  // 如果用户未认证，重定向到登录页
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🎓</div>
              <h1 className="text-xl font-semibold text-gray-900">BZ StudyPal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                欢迎, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-600 hover:border-red-800 rounded-md transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学习控制台</h2>
          <p className="text-gray-600">管理您的错题和复习计划</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">姓名</label>
              <p className="text-gray-900">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">邮箱</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">首选语言</label>
              <p className="text-gray-900">{user.preferredLanguage === 'zh' ? '中文' : 'English'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">注册时间</label>
              <p className="text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
              </p>
            </div>
          </div>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 错题管理 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📚</div>
              <h3 className="text-lg font-semibold text-gray-900">错题管理</h3>
            </div>
            <p className="text-gray-600 mb-4">添加、编辑和分类您的错题</p>
            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              管理错题
            </button>
          </div>

          {/* 学习统计 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-900">学习统计</h3>
            </div>
            <p className="text-gray-600 mb-4">查看您的学习进度和统计</p>
            <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              查看统计
            </button>
          </div>

          {/* 复习计划 */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📝</div>
              <h3 className="text-lg font-semibold text-gray-900">复习计划</h3>
            </div>
            <p className="text-gray-600 mb-4">制定和执行复习计划</p>
            <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
              开始复习
            </button>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
          <div className="text-center py-8 text-gray-500">
            暂无活动记录
          </div>
        </div>
      </main>
    </div>
  );
}
