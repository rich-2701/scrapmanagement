'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Factory, PenTool } from 'lucide-react';

export const ScrapEntryTabs: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isProduction = pathname.includes('/production');
  const isManual = pathname.includes('/manual');

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex shrink-0 self-start sm:self-auto transition-colors">
      <button
        onClick={() => router.push('/scrap/entry/production')}
        className={`
          flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
          ${isProduction
            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
        `}
      >
        <Factory size={16} className="mr-2" />
        Production (Job)
      </button>
      <button
        onClick={() => router.push('/scrap/entry/manual')}
        className={`
          flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
          ${isManual
            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
        `}
      >
        <PenTool size={16} className="mr-2" />
        Manual Entry
      </button>
    </div>
  );
};