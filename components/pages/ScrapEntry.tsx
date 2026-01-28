'use client';

import React, { useState } from 'react';
import { ProductionScrap } from './ProductionScrap';
import { ManualScrap } from './ManualScrap';
import { Factory, PenTool } from 'lucide-react';

export const ScrapEntry: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'production' | 'manual'>('production');

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Scrap Entry</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Record production waste or manual scrap items.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex shrink-0 self-start sm:self-auto transition-colors">
          <button
            onClick={() => setActiveTab('production')}
            className={`
              flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === 'production'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
            `}
          >
            <Factory size={16} className="mr-2" />
            Production (Job)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
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
      </div>

      <div>
        <div className={activeTab === 'production' ? 'block' : 'hidden'}>
          <ProductionScrap />
        </div>
        <div className={activeTab === 'manual' ? 'block' : 'hidden'}>
          <ManualScrap />
        </div>
      </div>
    </div>
  );
};