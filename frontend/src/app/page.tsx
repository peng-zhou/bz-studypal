'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    // 测试API连接
    const testAPI = async () => {
      try {
        // 测试健康检查
        const healthResponse = await fetch('http://localhost:8000/health');
        const healthData = await healthResponse.json();
        
        if (healthData.status === 'healthy') {
          setApiStatus('connected');
          
          // 获取科目列表
          const subjectsResponse = await fetch('http://localhost:8000/api/v1/subjects');
          const subjectsData = await subjectsResponse.json();
          
          if (subjectsData.success) {
            setSubjects(subjectsData.data);
          }
        }
      } catch (error) {
        console.error('API连接失败:', error);
        setApiStatus('error');
      }
    };

    testAPI();
  }, []);

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        {/* 项目标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            🎓 BZ StudyPal
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-400">
            智能错题管理与复习系统 | Smart Wrong Question Management & Review System
          </h2>
        </div>

        {/* API状态检查 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">🔧 系统状态检查 | System Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">前端服务:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                ✅ 运行中 (localhost:3000)
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">后端API:</span>
              {apiStatus === 'loading' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                  ⏳ 连接中...
                </span>
              )}
              {apiStatus === 'connected' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✅ 已连接 (localhost:8000)
                </span>
              )}
              {apiStatus === 'error' && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                  ❌ 连接失败
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">数据库:</span>
              {apiStatus === 'connected' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  ✅ SQLite 已连接
                </span>
              )}
              {apiStatus !== 'connected' && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                  ⏸️ 等待连接
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 科目列表测试 */}
        {subjects.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">📚 可用科目 | Available Subjects ({subjects.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {subjects.map((subject) => (
                <div 
                  key={subject.id}
                  className="p-3 rounded-md border text-center"
                  style={{ borderColor: subject.color }}
                >
                  <div className="text-sm font-medium">{subject.nameZh}</div>
                  <div className="text-xs text-gray-500">{subject.nameEn}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 项目信息 */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">🎯 核心功能</h3>
            <ul className="space-y-2 text-sm">
              <li>✅ 中英文双语支持</li>
              <li>✅ Google OAuth 登录</li>
              <li>✅ 错题拍照录入</li>
              <li>✅ 智能分类管理</li>
              <li>✅ 收藏复习系统</li>
              <li>✅ 学习进度统计</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">🛠️ 技术栈</h3>
            <ul className="space-y-2 text-sm">
              <li><strong>前端:</strong> Next.js 13+, TypeScript, Tailwind CSS</li>
              <li><strong>后端:</strong> Express.js, Prisma ORM</li>
              <li><strong>数据库:</strong> SQLite (开发) / PostgreSQL (生产)</li>
              <li><strong>认证:</strong> JWT + Google OAuth</li>
              <li><strong>国际化:</strong> next-i18next</li>
            </ul>
          </div>
        </div>

        {/* GitHub链接 */}
        <div className="mt-8 text-center">
          <a 
            href="https://github.com/peng-zhou/bz-studypal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            查看 GitHub 仓库
          </a>
        </div>
      </main>
    </div>
  );
}
