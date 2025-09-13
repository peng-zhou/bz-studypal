'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/authStore';
import { useRouter } from 'next/navigation';
import { questionsAPI, subjectsAPI } from '../../lib/api';
import AppLayout from '../../components/layout/AppLayout';
import AuthDebugger from '../../components/debug/AuthDebugger';
import AuthGuard from '../../components/auth/AuthGuard';

interface DashboardStats {
  totalQuestions: number;
  thisWeekQuestions: number;
  notMasteredQuestions: number;
  masteredQuestions: number;
  totalSubjects: number;
  recentActivity: {
    id: string;
    type: 'question_added' | 'question_reviewed' | 'subject_created';
    message: string;
    timestamp: string;
  }[];
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    thisWeekQuestions: 0,
    notMasteredQuestions: 0,
    masteredQuestions: 0,
    totalSubjects: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch statistics data in parallel
        const [questionStatsRes, subjectsRes] = await Promise.all([
          questionsAPI.getQuestionStats(),
          subjectsAPI.getSubjects()
        ]);
        
        if (questionStatsRes.success) {
          const questionStats = questionStatsRes.data;
          const newStats: DashboardStats = {
            totalQuestions: questionStats.totalCount || 0,
            thisWeekQuestions: questionStats.recentWeekCount || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            notMasteredQuestions: questionStats.byMastery.find((m: any) => m.masteryLevel === 'NOT_MASTERED')?._count || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            masteredQuestions: questionStats.byMastery.find((m: any) => m.masteryLevel === 'MASTERED')?._count || 0,
            totalSubjects: subjectsRes.success ? subjectsRes.data.length : 0,
            recentActivity: [
              {
                id: '1',
                type: 'question_added',
                message: t('dashboard.recentActivity'),
                timestamp: new Date().toISOString()
              }
            ]
          };
          setStats(newStats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, t]);

  return (
    <AuthGuard>
      <AuthDebugger />
      <AppLayout
        title={t('dashboard.title')} 
        description={t('dashboard.description')}
        showBreadcrumb={false}
      >
      {/* Statistics Data Cards */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">{t('common.loading')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-3">📚</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
                <div className="text-sm text-gray-600">{t('questions.totalQuestions')}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-3">✨</div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.thisWeekQuestions}</div>
                <div className="text-sm text-gray-600">{t('questions.thisWeek')}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-3">⚠️</div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.notMasteredQuestions}</div>
                <div className="text-sm text-gray-600">{t('questions.notMastered')}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-3">✅</div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.masteredQuestions}</div>
                <div className="text-sm text-gray-600">{t('questions.mastered')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* User Information Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.profile')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">{t('dashboard.userInfo.name')}</label>
            <p className="text-gray-900">{user?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('dashboard.userInfo.email')}</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('dashboard.userInfo.preferredLanguage')}</label>
            <p className="text-gray-900">{user?.preferredLanguage === 'zh' ? t('dashboard.userInfo.chinese') : t('dashboard.userInfo.english')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{t('dashboard.userInfo.memberSince')}</label>
            <p className="text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : t('common.unknown')}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Subject Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">🏷️</div>
            <h3 className="text-lg font-semibold text-gray-900">{t('subjects.title')}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t('subjects.description')}</p>
          <button 
            onClick={() => router.push('/subjects')}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            {t('navigation.subjects')}
          </button>
        </div>
        
        {/* Question Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-900">{t('questions.title')}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t('questions.description')}</p>
          <button 
            onClick={() => router.push('/questions')}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {t('navigation.questions')}
          </button>
        </div>

        {/* Learning Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">📈</div>
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.learningStats')}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t('dashboard.learningStatsDesc')}</p>
          <button className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
            {t('dashboard.viewStats')}
          </button>
        </div>

        {/* Review Plan */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="text-3xl mr-3">📝</div>
            <h3 className="text-lg font-semibold text-gray-900">{t('navigation.reviews')}</h3>
          </div>
          <p className="text-gray-600 mb-4">{t('dashboard.reviewPlanDesc')}</p>
          <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
            {t('dashboard.startReview')}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h3>
        <div className="text-center py-8 text-gray-500">
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl mr-3">
                    {activity.type === 'question_added' && '➕'}
                    {activity.type === 'question_reviewed' && '✔️'}
                    {activity.type === 'subject_created' && '🏷️'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>{t('dashboard.noRecentActivity')}</p>
          )}
        </div>
      </div>
      </AppLayout>
    </AuthGuard>
  );
}
