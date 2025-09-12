'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}


export default function Breadcrumb() {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Path mapping configuration
  const getPathConfig = (): Record<string, { name: string; parent?: string }> => ({
    '/dashboard': { name: t('navigation.dashboard') },
    '/subjects': { name: t('navigation.subjects'), parent: '/dashboard' },
    '/questions': { name: t('navigation.questions'), parent: '/dashboard' },
    '/settings': { name: t('navigation.settings'), parent: '/dashboard' },
  });

  // Build breadcrumb path
  const buildBreadcrumbs = (currentPath: string): BreadcrumbItem[] => {
    const pathConfig = getPathConfig();
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Get current path configuration
    const currentConfig = pathConfig[currentPath];
    if (!currentConfig) {
      return breadcrumbs;
    }

    // Recursively build parent paths
    const buildParentBreadcrumbs = (path: string): BreadcrumbItem[] => {
      const config = pathConfig[path];
      if (!config) return [];

      const parentBreadcrumbs: BreadcrumbItem[] = [];
      
      // If there's a parent, add parent first
      if (config.parent) {
        parentBreadcrumbs.push(...buildParentBreadcrumbs(config.parent));
      }
      
      // Add current level
      parentBreadcrumbs.push({
        name: config.name,
        href: path,
        current: false
      });
      
      return parentBreadcrumbs;
    };

    // Build complete breadcrumb
    if (currentConfig.parent) {
      breadcrumbs.push(...buildParentBreadcrumbs(currentConfig.parent));
    }
    
    // Add current page
    breadcrumbs.push({
      name: currentConfig.name,
      current: true
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null; // Don't display breadcrumb if only one level or no configuration
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((item, index) => (
          <li key={item.name} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-6 h-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            
            {item.current ? (
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.href!}
                className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-800 md:ml-2"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
