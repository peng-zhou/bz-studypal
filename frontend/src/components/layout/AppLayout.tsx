'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../stores/authStore';
import Navbar from '../navigation/Navbar';
import Breadcrumb from '../navigation/Breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showBreadcrumb?: boolean;
}

export default function AppLayout({ 
  children, 
  title, 
  description, 
  showBreadcrumb = true 
}: AppLayoutProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to login page if user is not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Don't render main content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        {showBreadcrumb && (
          <div className="mb-6">
            <Breadcrumb />
          </div>
        )}

        {/* Page Title and Description */}
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            )}
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
