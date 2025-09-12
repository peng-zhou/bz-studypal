'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/authStore';
import LanguageSwitcher from '../ui/LanguageSwitcher';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: '🏠' },
    { name: t('navigation.subjects'), href: '/subjects', icon: '🏷️' },
    { name: t('navigation.questions'), href: '/questions', icon: '📚' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Determine the current active navigation item
  const navigationWithCurrent = navigation.map(item => ({
    ...item,
    current: pathname === item.href
  }));

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-4">
              <div className="text-2xl">🎓</div>
              <h1 className="text-xl font-semibold text-gray-900">BZ StudyPal</h1>
            </Link>
          </div>

          {/* Main Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationWithCurrent.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* User Information */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 border border-red-600 hover:border-red-800 rounded-md transition-colors"
            >
              {t('navigation.logout')}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-1">
            {navigationWithCurrent.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
