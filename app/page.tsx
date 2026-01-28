'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import {
  TrendingUp,
  FileText,
  IndianRupee,
  PieChart,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [scrapByGroup, setScrapByGroup] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    if (typeof window !== 'undefined') {
      const companyUser = localStorage.getItem('scrap_company_user');
      const userName = localStorage.getItem('scrap_user_name');

      // If not authenticated, redirect to login
      if (!companyUser || !userName) {
        router.push('/login');
        return;
      }
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const { scrapApi } = await import('@/lib/api');

      const [summaryRes, materialsRes, trendRes, ledgerRes] = await Promise.all([
        scrapApi.getDashboardSummary(),
        scrapApi.getMaterials(), // Get materials with ItemGroupName
        scrapApi.getTrendData(7),
        scrapApi.getLedgerSummary() // Use same API as Scrap Ledger
      ]);

      if (summaryRes.success && summaryRes.data) {
        setDashboardData(summaryRes.data);
      }

      // Process Scrap by Category on frontend using materials and ledger data
      if (materialsRes.success && materialsRes.data && ledgerRes.success && ledgerRes.data) {
        const materials = Array.isArray(materialsRes.data) ? materialsRes.data : [];
        const ledgerItems = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];

        console.log('Materials data sample:', materials[0]);
        console.log('Ledger data sample:', ledgerItems[0]);

        // Create a map of itemId -> ItemGroupName
        const itemGroupMap = new Map();
        materials.forEach((mat: any) => {
          if (mat.id && mat.itemCategoryName) {
            itemGroupMap.set(mat.id, mat.itemCategoryName);
          }
        });

        // Group ledger items by ItemGroupName
        const groupedData: any = {};
        let grandTotal = 0;

        ledgerItems.forEach((item: any) => {
          const groupName = itemGroupMap.get(item.itemId) || 'Uncategorized';
          const totalReceived = item.totalReceipt || 0;
          const totalIssued = item.totalIssue || 0;

          if (!groupedData[groupName]) {
            groupedData[groupName] = {
              groupName,
              totalReceivedKg: 0,
              totalIssuedKg: 0,
              netStockKg: 0,
              itemCount: 0
            };
          }

          groupedData[groupName].totalReceivedKg += totalReceived;
          groupedData[groupName].totalIssuedKg += totalIssued;
          groupedData[groupName].netStockKg += (totalReceived - totalIssued);
          groupedData[groupName].itemCount += 1;
          grandTotal += totalReceived;
        });

        // Convert to array and calculate percentages
        const groupsArray = Object.values(groupedData).map((g: any) => ({
          ...g,
          totalReceivedKg: Math.round(g.totalReceivedKg * 100) / 100,
          totalIssuedKg: Math.round(g.totalIssuedKg * 100) / 100,
          netStockKg: Math.round(g.netStockKg * 100) / 100,
          percentage: grandTotal > 0 ? Math.round((g.totalReceivedKg / grandTotal) * 1000) / 10 : 0
        }));

        // Sort by total received descending
        groupsArray.sort((a, b) => b.totalReceivedKg - a.totalReceivedKg);

        console.log('Scrap by Category (frontend grouped):', groupsArray);
        setScrapByGroup(groupsArray);
      }

      if (trendRes.success && trendRes.data) {
        const rawData = Array.isArray(trendRes.data) ? trendRes.data : [];
        console.log('Raw trend data from API:', rawData);

        // Fill in missing days with 0 values to show full 7 days
        const filledData = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create map using YYYY-MM-DD format (local date, not UTC)
        const dataMap = new Map();
        rawData.forEach(d => {
          // Extract date portion directly from ISO string to avoid timezone conversion
          const dateStr = d.date.split('T')[0]; // Gets "2025-12-29" from "2025-12-29T00:00:00"
          console.log('Mapping date:', dateStr, 'with data:', d);
          dataMap.set(dateStr, d);
        });

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          // Use local date string to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;

          if (dataMap.has(dateKey)) {
            const existingData = dataMap.get(dateKey);
            console.log('Found data for', dateKey, ':', existingData);
            filledData.push(existingData);
          } else {
            console.log('No data for', dateKey, 'adding zeros');
            filledData.push({
              date: date.toISOString(),
              dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
              scrapInKg: 0,
              scrapOutKg: 0,
              netKg: 0
            });
          }
        }

        console.log('Filled trend data (7 days):', filledData);
        setTrendData(filledData);
      }

      if (ledgerRes.success && ledgerRes.data) {
        console.log('Ledger Summary:', ledgerRes.data);
        // Transform ledger summary data to recent activity format
        const recentItems = Array.isArray(ledgerRes.data)
          ? ledgerRes.data.slice(0, 5).map((item: any) => ({
            transactionId: item.itemId,
            voucherNo: 'Multiple',
            voucherDate: new Date().toISOString(),
            transactionType: item.totalReceipt > 0 ? 'IN' : 'OUT',
            itemId: item.itemId,
            itemName: item.itemName,
            itemCode: item.itemCode || '',
            quantity: item.totalReceipt > 0 ? item.totalReceipt : item.totalIssue,
            stockUnit: item.stockUnit || 'KG',
            particular: ''
          }))
          : [];
        setRecentActivity(recentItems);
      }
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading dashboard:</p>
          <p className="text-sm">{error}</p>
          <button onClick={fetchDashboardData} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Scrap Qty',
              val: dashboardData ? formatNumber(dashboardData.currentStockKg) : '0',
              icon: TrendingUp,
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            },
            {
              label: 'Sales Value',
              val: dashboardData ? `₹${formatNumber(dashboardData.totalSalesValue)}` : '₹0',
              icon: IndianRupee,
              color: 'text-green-600',
              bg: 'bg-green-50'
            },
            {
              label: 'Pending to Sale',
              val: dashboardData ? String(dashboardData.pendingEntries) : '0',
              icon: FileText,
              color: 'text-orange-600',
              bg: 'bg-orange-50'
            },
            {
              label: 'Processing Rate %',
              val: dashboardData ? `${dashboardData.efficiency}%` : '0%',
              icon: PieChart,
              color: 'text-purple-600',
              bg: 'bg-purple-50'
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} dark:bg-opacity-20 ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.val}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doughnut Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Scrap by Category</h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
              {scrapByGroup.length > 0 ? (
                <>
                  {/* CSS Only Doughnut Chart */}
                  <div className="relative w-48 h-48 rounded-full shadow-inner flex-shrink-0" style={{
                    background: scrapByGroup.length > 0 ? (() => {
                      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
                      let gradientString = '';
                      let accumulated = 0;
                      scrapByGroup.forEach((group, index) => {
                        const color = colors[index % colors.length];
                        const percentage = group.percentage || 0;
                        gradientString += `${color} ${accumulated}% ${accumulated + percentage}%${index < scrapByGroup.length - 1 ? ',' : ''}`;
                        accumulated += percentage;
                      });
                      return `conic-gradient(${gradientString})`;
                    })() : 'conic-gradient(#e2e8f0 0% 100%)'
                  }}>
                    <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center flex-col shadow-sm">
                      <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {dashboardData ? formatNumber(dashboardData.totalScrapKg / 1000) + 'T' : '0'}
                      </span>
                      <span className="text-[10px] text-slate-400 transition-colors uppercase font-bold">Total Volume</span>
                    </div>
                  </div>

                  {/* Legend - Bottom */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                    {scrapByGroup.map((group, i) => {
                      const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'];
                      return (
                        <div key={i} className="flex items-center space-x-2 justify-center sm:justify-start">
                          <span className={`w-3 h-3 rounded-full ${colors[i % colors.length]} flex-shrink-0`}></span>
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{group.groupName}</p>
                            <p className="text-[10px] text-slate-400">{group.percentage}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <p className="text-sm">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
                  Scrap Trends
                </h3>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-600"></span>
                    <span className="text-[10px] text-slate-500 font-semibold">IN</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-600"></span>
                    <span className="text-[10px] text-slate-500 font-semibold">OUT</span>
                  </div>
                </div>
              </div>
              <select className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-600 dark:text-slate-300 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="flex-1 flex items-end justify-between space-x-2 px-2 pb-2">
              {trendData.length > 0 ? (
                (() => {
                  const maxValue = Math.max(...trendData.map(d => Math.max(d.scrapInKg || 0, d.scrapOutKg || 0)));
                  console.log('Chart rendering - maxValue:', maxValue, 'trendData length:', trendData.length);
                  return trendData.map((d, i) => {
                    const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                    const inHeight = maxValue > 0 ? ((d.scrapInKg || 0) / maxValue) * 100 : 0;
                    const outHeight = maxValue > 0 ? ((d.scrapOutKg || 0) / maxValue) * 100 : 0;
                    console.log(`Day ${i} (${dayName}): scrapInKg=${d.scrapInKg}, inHeight=${inHeight}%, outHeight=${outHeight}%`);

                    return (
                      <div key={i} className="flex flex-col items-center group">
                        <div className="flex gap-1 items-end h-48 mb-3">
                          {/* IN Bar */}
                          <div className="w-4 bg-slate-100 dark:bg-slate-800 rounded-t-lg relative h-full group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-green-600 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-green-500"
                              style={{ height: `${inHeight}%` }}
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                                IN:{d.scrapInKg}kg
                              </div>
                            </div>
                          </div>
                          {/* OUT Bar */}
                          <div className="w-4 bg-slate-100 dark:bg-slate-800 rounded-t-lg relative h-full group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-red-600 rounded-t-lg transition-all duration-500 ease-out group-hover:bg-red-500"
                              style={{ height: `${outHeight}%` }}
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                                OUT:{d.scrapOutKg}kg
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">{dayName}</span>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                  No trend data available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Stock Additions</h3>
            <button
              onClick={() => router.push('/scrap/ledger')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, i) => {
                const isIn = activity.transactionType === 'IN';
                const isSale = activity.transactionType === 'SALE';
                const bgColor = isIn ? 'bg-green-50' : isSale ? 'bg-blue-50' : 'bg-red-50';
                const textColor = isIn ? 'text-green-600' : isSale ? 'text-blue-600' : 'text-red-600';
                const borderColor = isIn ? 'border-green-100' : isSale ? 'border-blue-100' : 'border-red-100';
                const prefix = isIn ? '+' : isSale ? 'SOLD' : '-';

                return (
                  <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${bgColor} dark:bg-opacity-20 flex items-center justify-center ${textColor} font-bold text-xs`}>
                        {activity.itemCode?.substring(0, 2) || 'SC'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{activity.itemName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(activity.voucherDate).toLocaleDateString()} • {activity.voucherNo}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${textColor} ${bgColor} dark:bg-opacity-20 px-2 py-1 rounded text-sm border ${borderColor} dark:border-opacity-30`}>
                      {isSale ? prefix : prefix + activity.quantity} {activity.stockUnit || 'KG'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout activePage="dashboard">
      <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
}