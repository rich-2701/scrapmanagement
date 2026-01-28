'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { Layout } from '@/components/Layout';

export const ScrapLedger: React.FC = () => {
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemLastUpdates, setItemLastUpdates] = useState<Record<number, string>>({});

  // Helper to convert data to CSV
  const convertToCSV = (data: any[], type: 'summary' | 'detailed' | 'stock') => {
    if (!data.length) return '';

    let headers: string[] = [];
    let rows: any[] = [];

    if (type === 'summary') {
      headers = ['Material', 'Item Code', 'Group', 'Total IN', 'Total OUT', 'Balance', 'Unit'];
      rows = data.map(item => [
        `"${item.itemName?.replace(/"/g, '""') || ''}"`,
        `"${item.itemCode || ''}"`,
        `"${item.itemGroup || ''}"`,
        item.totalReceipt || 0,
        item.totalIssue || 0,
        item.balance || 0,
        item.stockUnit || ''
      ]);
    } else if (type === 'stock') {
      headers = ['Material', 'Code', 'Group', 'Total IN', 'Total OUT', 'Current Stock', 'Unit', 'Last Updated'];
      rows = data.map(item => [
        `"${item.itemName?.replace(/"/g, '""') || ''}"`,
        `"${item.itemCode || ''}"`,
        `"${item.itemGroup || ''}"`,
        item.totalReceipt || 0,
        item.totalIssue || 0,
        item.balance || 0,
        item.stockUnit || '',
        itemLastUpdates[item.itemId] ? new Date(itemLastUpdates[item.itemId]).toLocaleDateString() : 'No transactions'
      ]);
    } else {
      headers = ['Date', 'Voucher Number', 'Type', 'IN Qty', 'OUT Qty', 'Sale Amount', 'Balance', 'Remark'];
      rows = data.map(item => [
        item.voucherDate ? new Date(item.voucherDate).toLocaleString() : '',
        `"${item.voucherNumber || ''}"`,
        item.transactionType || '',
        item.receiptQuantity || 0,
        item.issueQuantity || 0,
        item.saleAmount || 0,
        item.balance || 0,
        `"${item.remark?.replace(/"/g, '""') || ''}"`
      ]);
    }

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleExport = () => {
    let dataToExport;
    let exportType: 'summary' | 'detailed' | 'stock';

    if (viewMode === 'summary') {
      if (ledgerType === 'stock') {
        dataToExport = sortedStockData; // Use sorted stock data
        exportType = 'stock';
      } else {
        dataToExport = sortedSummary; // Use sorted summary data
        exportType = 'summary';
      }
    } else {
      dataToExport = ledgerData;
      exportType = 'detailed';
    }

    if (!dataToExport.length) return;

    const csvContent = convertToCSV(dataToExport, exportType);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scrap_ledger_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [ledgerType, setLedgerType] = useState<'sales' | 'stock'>('sales'); // New state for radio toggle
  const [sortBy, setSortBy] = useState<'itemName' | 'itemCode' | 'itemGroup' | 'totalReceipt' | 'totalIssue' | 'balance' | 'stockUnit'>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // Stock Ledger sorting state
  const [stockSortBy, setStockSortBy] = useState<'itemName' | 'itemCode' | 'itemGroup' | 'totalReceipt' | 'totalIssue' | 'balance' | 'stockUnit' | 'lastUpdated'>('itemName');
  const [stockSortOrder, setStockSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Explicitly handle data fetching based on active view and dependencies
    if (viewMode === 'summary') {
      fetchLedgerSummary();
    } else if (viewMode === 'detailed' && selectedItemId) {
      fetchLedgerDetails();
    }
  }, [viewMode, selectedItemId, fromDate, toDate]);

  // Fetch last updated dates for Stock Ledger view
  useEffect(() => {
    const fetchLastUpdates = async () => {
      if (viewMode === 'summary' && ledgerType === 'stock' && summaryData.length > 0) {
        try {
          const { scrapApi } = await import('@/lib/api');
          const updates: Record<number, string> = {};

          // Fetch last transaction for each item (limit to first 5 for performance)
          const itemsToFetch = summaryData.slice(0, 10);

          for (const item of itemsToFetch) {
            try {
              const result = await scrapApi.getLedger({ itemId: item.itemId });
              if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                // Get the most recent transaction date (first item since backend returns newest first)
                const latestDate = result.data[0].voucherDate;
                if (latestDate) {
                  updates[item.itemId] = latestDate;
                }
              }
            } catch (err) {
              console.error(`Failed to fetch last update for item ${item.itemId}:`, err);
            }
          }

          setItemLastUpdates(updates);
        } catch (err) {
          console.error('Error fetching last updates:', err);
        }
      }
    };

    fetchLastUpdates();
  }, [viewMode, ledgerType, summaryData]);

  const fetchLedgerSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const { scrapApi } = await import('@/lib/api');

      const params: any = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const result = await scrapApi.getLedgerSummary(params);

      if (result.success && result.data) {
        setSummaryData(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err: any) {
      console.error('Ledger summary fetch error:', err);
      setError(err.message || 'Failed to load ledger summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const { scrapApi } = await import('@/lib/api');

      const params: any = {};
      if (selectedItemId) params.itemId = selectedItemId;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      console.log('Fetching ledger details with params:', params);

      const result = await scrapApi.getLedger(params);

      if (result.success && result.data) {
        let data = Array.isArray(result.data) ? result.data : [];

        // Frontend Balance Calculation Fix:
        // Backend returns data Descending (Newest First). 
        // We need to calculate balance Chronologically (Oldest First).

        // 1. Sort Chronologically (Oldest First)
        // We can just reverse the array since backend sends Newest First
        const chronologicalData = [...data].reverse();

        let runningBalance = 0;

        // 2. Calculate Running Balance
        const dataWithBalance = chronologicalData.map((item) => {
          // Ensure values are numbers
          const receipt = Number(item.receiptQuantity) || 0;
          const issue = Number(item.issueQuantity) || 0;

          runningBalance += (receipt - issue);

          return {
            ...item,
            balance: runningBalance
          };
        });

        // 3. Reverse back to Descending (Newest First) for display
        const displayData = dataWithBalance.reverse();

        setLedgerData(displayData);
      }
    } catch (err: any) {
      console.error('Ledger details fetch error:', err);
      setError(err.message || 'Failed to load ledger details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (itemId: number) => {
    setSelectedItemId(itemId);
    setViewMode('detailed');
  };

  const handleBackToSummary = () => {
    setViewMode('summary');
    setSelectedItemId(null);
    setLedgerData([]);
  };

  // Handle column header click for sorting (Sales Ledger)
  const handleSort = (column: 'itemName' | 'itemCode' | 'itemGroup' | 'totalReceipt' | 'totalIssue' | 'balance' | 'stockUnit') => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle column header click for sorting (Stock Ledger)
  const handleStockSort = (column: 'itemName' | 'itemCode' | 'itemGroup' | 'totalReceipt' | 'totalIssue' | 'balance' | 'stockUnit' | 'lastUpdated') => {
    if (stockSortBy === column) {
      setStockSortOrder(stockSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStockSortBy(column);
      setStockSortOrder('asc');
    }
  };

  // Filter summary data
  const filteredSummary = summaryData.filter(item =>
    !searchQuery ||
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort filtered summary data
  const sortedSummary = [...filteredSummary].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'itemName':
        aValue = a.itemName?.toLowerCase() || '';
        bValue = b.itemName?.toLowerCase() || '';
        break;
      case 'itemCode':
        aValue = a.itemCode?.toLowerCase() || '';
        bValue = b.itemCode?.toLowerCase() || '';
        break;
      case 'itemGroup':
        aValue = a.itemGroup?.toLowerCase() || '';
        bValue = b.itemGroup?.toLowerCase() || '';
        break;
      case 'totalReceipt':
        aValue = a.totalReceipt || 0;
        bValue = b.totalReceipt || 0;
        break;
      case 'totalIssue':
        aValue = a.totalIssue || 0;
        bValue = b.totalIssue || 0;
        break;
      case 'balance':
        aValue = a.balance || 0;
        bValue = b.balance || 0;
        break;
      case 'stockUnit':
        aValue = a.stockUnit?.toLowerCase() || '';
        bValue = b.stockUnit?.toLowerCase() || '';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Sort stock ledger data
  const sortedStockData = [...sortedSummary].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (stockSortBy) {
      case 'itemName':
        aValue = a.itemName?.toLowerCase() || '';
        bValue = b.itemName?.toLowerCase() || '';
        break;
      case 'itemCode':
        aValue = a.itemCode?.toLowerCase() || '';
        bValue = b.itemCode?.toLowerCase() || '';
        break;
      case 'itemGroup':
        aValue = a.itemGroup?.toLowerCase() || '';
        bValue = b.itemGroup?.toLowerCase() || '';
        break;
      case 'totalReceipt':
        aValue = a.totalReceipt || 0;
        bValue = b.totalReceipt || 0;
        break;
      case 'totalIssue':
        aValue = a.totalIssue || 0;
        bValue = b.totalIssue || 0;
        break;
      case 'balance':
        aValue = a.balance || 0;
        bValue = b.balance || 0;
        break;
      case 'stockUnit':
        aValue = a.stockUnit?.toLowerCase() || '';
        bValue = b.stockUnit?.toLowerCase() || '';
        break;
      case 'lastUpdated':
        aValue = itemLastUpdates[a.itemId] || '';
        bValue = itemLastUpdates[b.itemId] || '';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return stockSortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return stockSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Layout activePage="ledger">
      <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {/* Header (Back button etc) */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-2">
              {viewMode === 'detailed' && (
                <button
                  onClick={handleBackToSummary}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
                >
                  ← Back to Summary
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Radio Button Toggle for Ledger Type - Moved before search */}
              {viewMode === 'summary' && (
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ledgerType"
                      value="sales"
                      checked={ledgerType === 'sales'}
                      onChange={(e) => setLedgerType(e.target.value as 'sales' | 'stock')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sales Ledger</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ledgerType"
                      value="stock"
                      checked={ledgerType === 'stock'}
                      onChange={(e) => setLedgerType(e.target.value as 'sales' | 'stock')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Stock Ledger</span>
                  </label>
                </div>
              )}

              {/* Show search for Summary view */}
              {viewMode === 'summary' && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={18} className="text-slate-400" />
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From Date"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Calendar size={18} className="text-slate-400" />
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To Date"
                />
              </div>

              <button
                onClick={handleExport}
                className="flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-colors shadow-sm active:scale-95 whitespace-nowrap h-[38px]"
              >
                <Download size={16} className="mr-2" /> Export
              </button>
            </div>
          </div>

          {/* Content Area */}
          {/* Stock Summary View - Sales Ledger */}
          {viewMode === 'summary' && ledgerType === 'sales' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th
                        className="p-4 cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                        onClick={() => handleSort('itemName')}
                      >
                        Material
                      </th>
                      <th
                        className="p-4 hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                        onClick={() => handleSort('itemGroup')}
                      >
                        Group
                      </th>
                      <th
                        className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                        onClick={() => handleSort('totalReceipt')}
                      >
                        Total IN
                      </th>
                      <th
                        className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                        onClick={() => handleSort('totalIssue')}
                      >
                        Total OUT
                      </th>
                      <th
                        className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                        onClick={() => handleSort('balance')}
                      >
                        Balance
                      </th>
                      <th className="p-4">Created By</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      [1, 2, 3, 4].map(i => (
                        <tr key={i}>
                          <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                          <td className="p-4 hidden md:table-cell"><Skeleton className="h-6 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                          <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-red-600">
                          <p className="font-semibold">Error loading ledger data</p>
                          <p className="text-sm text-slate-500 mt-1">{error}</p>
                          <button onClick={fetchLedgerSummary} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : sortedSummary.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No ledger entries found
                        </td>
                      </tr>
                    ) : (
                      sortedSummary.map((item) => (
                        <tr key={item.itemId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <td className="p-4">
                            <div className="font-medium text-slate-800 dark:text-slate-100">{item.itemName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.itemCode}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                              {item.itemGroup}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-green-600">
                              <ArrowUpCircle size={14} />
                              <span className="font-semibold">{formatNumber(item.totalReceipt)}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.stockUnit}
                              {item.stockUnit?.toUpperCase() === 'PCS' && item.wtPerPacking && (
                                <span className="text-green-600"> ({formatNumber(item.totalReceipt * item.wtPerPacking)} KG)</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-red-600">
                              <ArrowDownCircle size={14} />
                              <span className="font-semibold">{formatNumber(item.totalIssue)}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.stockUnit}
                              {item.stockUnit?.toUpperCase() === 'PCS' && item.wtPerPacking && (
                                <span className="text-red-600"> ({formatNumber(item.totalIssue * item.wtPerPacking)} KG)</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="font-bold text-blue-600 text-lg">{formatNumber(item.balance)}</div>
                            <div className="text-xs text-slate-500">
                              {item.stockUnit}
                              {item.stockUnit?.toUpperCase() === 'PCS' && item.wtPerPacking && (
                                <div className="text-blue-600 font-medium">({formatNumber(item.balance * item.wtPerPacking)} KG)</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                            {typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('scrap_user_data') || '{}')?.Username || 'Admin' : 'Admin'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleViewDetails(item.itemId)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Ledger View - Shows all scrap items with details */}
          {viewMode === 'summary' && ledgerType === 'stock' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('itemName')}>Material</th>
                      <th className="p-4 hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('itemCode')}>Code</th>
                      <th className="p-4 hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('itemGroup')}>Group</th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('totalReceipt')}>Total IN</th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('totalIssue')}>Total OUT</th>
                      <th className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('balance')}>Current Stock</th>
                      <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('stockUnit')}>Unit</th>
                      <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleStockSort('lastUpdated')}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      [1, 2, 3, 4, 5].map(i => (
                        <tr key={i}>
                          <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                          <td className="p-4 hidden md:table-cell"><Skeleton className="h-6 w-24" /></td>
                          <td className="p-4 hidden md:table-cell"><Skeleton className="h-6 w-20" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-red-600">
                          <p className="font-semibold">Error loading stock data</p>
                          <p className="text-sm text-slate-500 mt-1">{error}</p>
                          <button onClick={fetchLedgerSummary} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : sortedSummary.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No stock data found
                        </td>
                      </tr>
                    ) : (
                      sortedStockData.map((item) => (
                        <tr key={item.itemId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <td className="p-4">
                            <div className="font-medium text-slate-800 dark:text-slate-100">{item.itemName}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell font-mono">
                            {item.itemCode}
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                              {item.itemGroup}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-green-600">
                              <ArrowUpCircle size={14} />
                              <span className="font-semibold">{formatNumber(item.totalReceipt)}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1 text-red-600">
                              <ArrowDownCircle size={14} />
                              <span className="font-semibold">{formatNumber(item.totalIssue)}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="font-bold text-blue-600 text-lg">{formatNumber(item.balance)}</div>
                            {item.stockUnit?.toUpperCase() === 'PCS' && item.wtPerPacking && (
                              <div className="text-xs text-blue-600 font-medium">({formatNumber(item.balance * item.wtPerPacking)} KG)</div>
                            )}
                          </td>
                          <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {item.stockUnit}
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                            {itemLastUpdates[item.itemId]
                              ? new Date(itemLastUpdates[item.itemId]).toLocaleDateString()
                              : 'No transactions'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Detailed View */}
          {viewMode === 'detailed' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4">Date</th>
                      <th className="p-4">Voucher</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">IN Qty</th>
                      <th className="p-4 text-right">OUT Qty</th>
                      <th className="p-4 text-right">Sale Amount</th>
                      <th className="p-4 text-right">Balance</th>
                      <th className="p-4">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      [1, 2, 3, 4].map(i => (
                        <tr key={i}>
                          <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-12" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-20 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                          <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                        </tr>
                      ))
                    ) : error ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-red-600">
                          <p className="font-semibold">Error loading transaction details</p>
                          <p className="text-sm text-slate-500 mt-1">{error}</p>
                          <button onClick={fetchLedgerDetails} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : ledgerData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No transactions found for selected period
                        </td>
                      </tr>
                    ) : (
                      ledgerData.map((txn, index) => (
                        <tr key={`${txn.transactionId}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <td className="p-4">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {txn.voucherDate ? new Date(txn.voucherDate).toLocaleString() : '-'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-mono text-slate-700 dark:text-slate-300">{txn.voucherNumber}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${txn.transactionType === 'IN'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                              }`}>
                              {txn.transactionType}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {txn.receiptQuantity > 0 ? formatNumber(txn.receiptQuantity) : '-'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {txn.issueQuantity > 0 ? formatNumber(txn.issueQuantity) : '-'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {txn.saleAmount ? (
                              <span className="font-bold text-green-600 dark:text-green-400">₹{formatNumber(txn.saleAmount)}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{formatNumber(txn.balance)}</span>
                          </td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{txn.remark || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
