'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  redirectDelay?: number;
}

/**
 * 认证保护组件
 * 如果用户未认证，显示提示信息并重定向到登录页面
 */
export default function AuthGuard({ 
  children, 
  fallback,
  redirectTo = '/auth/login',
  redirectDelay = 1500
}: AuthGuardProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // 如果认证状态已经加载完成
    if (!isLoading) {
      // 如果用户未认证，准备重定向
      if (!isAuthenticated || !user) {
        setRedirecting(true);
        const redirectTimer = setTimeout(() => {
          router.push(redirectTo);
        }, redirectDelay);
        
        return () => clearTimeout(redirectTimer);
      }
    }
  }, [isLoading, isAuthenticated, user, router, redirectTo, redirectDelay]);

  // 如果认证状态正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // 如果用户未认证，显示重定向信息
  if (!isAuthenticated || !user) {
    // 如果提供了自定义 fallback，使用它
    if (fallback) {
      return <>{fallback}</>;
    }

    // 否则显示默认的重定向界面
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          {redirecting ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 mb-2">{t('auth.redirectingToLogin')}</p>
              <p className="text-sm text-gray-500">{t('auth.redirectingMessage')}</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-gray-600 mb-4">{t('auth.authRequired')}</p>
              <button
                onClick={() => router.push(redirectTo)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('auth.goToLogin')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 用户已认证，渲染子组件
  return <>{children}</>;
}
