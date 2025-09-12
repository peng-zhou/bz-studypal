'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../stores/authStore';
import { subjectsAPI, Subject } from '../../lib/api';

export default function SubjectsPage() {
  const { isAuthenticated, user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nameZh: '',
    nameEn: '',
    description: '',
    color: '#2196F3',
    order: 0
  });

  // 获取科目列表
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectsAPI.getSubjects();
      if (response.success) {
        setSubjects(response.data);
      } else {
        setError(response.error || '获取科目列表失败');
      }
    } catch (error) {
      console.error('获取科目列表错误:', error);
      setError('获取科目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        // 更新科目
        const response = await subjectsAPI.updateSubject(editingSubject.id, formData);
        if (response.success) {
          await fetchSubjects();
          setIsModalOpen(false);
          setEditingSubject(null);
          resetForm();
        } else {
          setError(response.error || '更新科目失败');
        }
      } else {
        // 创建科目
        const response = await subjectsAPI.createSubject(formData);
        if (response.success) {
          await fetchSubjects();
          setIsModalOpen(false);
          resetForm();
        } else {
          setError(response.error || '创建科目失败');
        }
      }
    } catch (error) {
      console.error('提交表单错误:', error);
      setError('操作失败，请重试');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      code: '',
      nameZh: '',
      nameEn: '',
      description: '',
      color: '#2196F3',
      order: 0
    });
  };

  // 打开编辑模态框
  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      nameZh: subject.nameZh,
      nameEn: subject.nameEn,
      description: subject.description || '',
      color: subject.color || '#2196F3',
      order: subject.order
    });
    setIsModalOpen(true);
  };

  // 删除科目
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个科目吗？')) return;

    try {
      const response = await subjectsAPI.deleteSubject(id);
      if (response.success) {
        await fetchSubjects();
      } else {
        setError(response.error || '删除科目失败');
      }
    } catch (error) {
      console.error('删除科目错误:', error);
      setError('删除科目失败');
    }
  };

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录以访问科目管理</p>
          <a href="/auth/login" className="text-blue-600 hover:text-blue-800">
            前往登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ← 返回主页
              </a>
              <h1 className="text-xl font-semibold text-gray-900">科目管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                欢迎, {user?.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">科目列表</h2>
          <button
            onClick={() => {
              resetForm();
              setEditingSubject(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
          >
            添加科目
          </button>
        </div>

        {/* 科目列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div 
                    className="w-4 h-4 rounded-full mr-3" 
                    style={{ backgroundColor: subject.color || '#2196F3' }}
                  ></div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {subject.nameZh}
                  </h3>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">英文名:</span> {subject.nameEn}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">代码:</span> {subject.code}
                  </p>
                  {subject.description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">描述:</span> {subject.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">排序:</span> {subject.order}
                  </p>
                  {subject._count && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">错题数:</span> {subject._count.questions}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(subject)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    disabled={subject._count?.questions && subject._count.questions > 0}
                    className={`flex-1 px-3 py-2 text-sm rounded-md ${
                      subject._count?.questions && subject._count.questions > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && subjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无科目</h3>
            <p className="text-gray-600 mb-4">开始创建您的第一个科目吧！</p>
            <button
              onClick={() => {
                resetForm();
                setEditingSubject(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              添加科目
            </button>
          </div>
        )}
      </main>

      {/* 添加/编辑科目模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSubject ? '编辑科目' : '添加科目'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  科目代码 *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如: math, english"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  中文名称 *
                </label>
                <input
                  type="text"
                  value={formData.nameZh}
                  onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如: 数学"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  英文名称 *
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如: Mathematics"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="科目描述（可选）"
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    颜色
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSubject(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  {editingSubject ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
