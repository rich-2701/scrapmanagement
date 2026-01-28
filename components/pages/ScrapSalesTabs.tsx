'use client';

import React from 'react';
import { Factory, PenTool, Layers, ShoppingCart } from 'lucide-react';

interface ScrapSalesTabsProps {
  activeTab: 'all' | 'production' | 'manual';
  onTabChange: (tab: 'all' | 'production' | 'manual') => void;
}

export const ScrapSalesTabs: React.FC<ScrapSalesTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex shrink-0 self-start sm:self-auto">
      <button
        onClick={() => onTabChange('all')}
        className={`
          flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
          ${activeTab === 'all'
            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
        `}
      >
        <Layers size={16} className="mr-2" />
        All
      </button>
      <button
        onClick={() => onTabChange('production')}
        className={`
          flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
          ${activeTab === 'production'
            ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
        `}
      >
        <Factory size={16} className="mr-2" />
        Production
      </button>
      <button
        onClick={() => onTabChange('manual')}
        className={`
          flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
          ${activeTab === 'manual'
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
