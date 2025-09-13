'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/authStore';
import { subjectsAPI, Subject } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';

export default function SubjectsPage() {
  const { t } = useTranslation();
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

  // Get subjects list
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        // Update subject
        const response = await subjectsAPI.updateSubject(editingSubject.id, formData);
        if (response.success) {
          await fetchSubjects();
          setIsModalOpen(false);
          setEditingSubject(null);
          resetForm();
        } else {
        setError(response.error || t('subjects.errors.updateFailed'));
        }
      } else {
        // Create subject
        const response = await subjectsAPI.createSubject(formData);
        if (response.success) {
          await fetchSubjects();
          setIsModalOpen(false);
          resetForm();
        } else {
        setError(response.error || t('subjects.errors.createFailed'));
        }
      }
    } catch (error) {
      console.error('Submit form error:', error);
      setError(t('subjects.errors.submitError'));
    }
  };

  // Reset form
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

  // Open edit modal
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

  // Delete subject
  const handleDelete = async (id: string) => {
    if (!confirm(t('subjects.confirm.delete'))) return;

    try {
      const response = await subjectsAPI.deleteSubject(id);
      if (response.success) {
        await fetchSubjects();
      } else {
        setError(response.error || t('subjects.errors.deleteFailed'));
      }
    } catch (error) {
      console.error('Delete subject error:', error);
      setError(t('subjects.errors.deleteFailed'));
    }
  };

  return (
    <AppLayout title={t('subjects.title')} description={t('subjects.description')}>
        {/* Error Message */}
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

        {/* Action Buttons */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('subjects.list')}</h2>
          <button
            onClick={() => {
              resetForm();
              setEditingSubject(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
          >
            {t('subjects.add')}
          </button>
        </div>

        {/* Subjects List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">{t('common.actions.loading')}</span>
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
                    <span className="font-medium">{t('subjects.fields.englishName')}</span> {subject.nameEn}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t('subjects.fields.code')}</span> {subject.code}
                  </p>
                  {subject.description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t('subjects.fields.description')}</span> {subject.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t('subjects.fields.order')}</span> {subject.order}
                  </p>
                  {subject._count && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t('subjects.fields.questionCount')}</span> {subject._count.questions}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(subject)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
                  >
                    {t('subjects.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    disabled={!!(subject._count?.questions && subject._count.questions > 0)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md ${
                      subject._count?.questions && subject._count.questions > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    {t('subjects.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && subjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('subjects.empty.title')}</h3>
            <p className="text-gray-600 mb-4">{t('subjects.empty.description')}</p>
            <button
              onClick={() => {
                resetForm();
                setEditingSubject(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              {t('subjects.empty.action')}
            </button>
          </div>
        )}

      {/* Add/Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSubject ? t('subjects.edit') : t('subjects.add')}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('subjects.form.code')} *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('subjects.form.codePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('subjects.form.nameZh')} *
                </label>
                <input
                  type="text"
                  value={formData.nameZh}
                  onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('subjects.form.nameZhPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('subjects.form.nameEn')} *
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('subjects.form.nameEnPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('subjects.form.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder={t('subjects.form.descriptionPlaceholder')}
                />
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subjects.form.color')}
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
                    {t('subjects.form.order')}
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
                  {t('subjects.form.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  {editingSubject ? t('subjects.form.update') : t('subjects.form.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
