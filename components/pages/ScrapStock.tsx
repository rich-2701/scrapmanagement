'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, MoreHorizontal, ArrowUpDown, Download, Grid, List, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { Layout } from '@/components/Layout';

export const ScrapStock: React.FC = () => {
    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [totalItems, setTotalItems] = useState(0);

    // Helper to convert array of objects to CSV
    const convertToCSV = (data: any[]) => {
        if (!data.length) return '';

        const headers = ['Item Name', 'Item Code', 'Group', 'Net Stock', 'Unit', 'Last Updated'];
        const rows = data.map(item => [
            `"${item.itemName?.replace(/"/g, '""') || ''}"`,
            `"${item.itemCode || ''}"`,
            `"${item.itemGroup || ''}"`,
            item.netStock || 0,
            item.stockUnit || '',
            item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : ''
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    };

    const handleExport = () => {
        if (!stockData.length) return;

        const csvContent = convertToCSV(stockData); // Exporting currently loaded data (current page)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `scrap_stock_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [entryType, setEntryType] = useState<'ALL' | 'PRODUCTION' | 'MANUAL'>('ALL');
    const [sortBy, setSortBy] = useState<'itemName' | 'itemGroup' | 'netStock' | 'stockUnit' | 'lastUpdated'>('lastUpdated');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStockData();
    }, [selectedGroup, entryType, currentPage, itemsPerPage]); // Re-fetch when page changes

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]); // Reset page on search (Note: Search currently only filters current page unless API updated)

    const fetchStockData = async () => {
        try {
            setLoading(true);
            setError('');

            const { scrapApi } = await import('@/lib/api');
            const result = await scrapApi.getStock(
                selectedGroup || undefined,
                entryType === 'ALL' ? undefined : entryType,
                currentPage,
                itemsPerPage
            );

            if (result.success && result.data) {
                setStockData(Array.isArray(result.data) ? result.data : []);
                setTotalItems((result as any).count || 0);
            }
        } catch (err: any) {
            console.error('Stock data fetch error:', err);
            setError(err.message || 'Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    // Handle column header click for sorting (Client-side sort for current page)
    const handleSort = (column: 'itemName' | 'itemGroup' | 'netStock' | 'stockUnit' | 'lastUpdated') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // Filter stock data (Client Side) - Fix for Search Bar
    const filteredStockDataRaw = stockData.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (item.itemName?.toLowerCase() || '').includes(q) ||
            (item.itemCode?.toLowerCase() || '').includes(q) ||
            (item.itemGroup?.toLowerCase() || '').includes(q)
        );
    });

    // Sort stock data (Current Page Only)
    const sortedStockData = [...filteredStockDataRaw].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
            case 'itemName':
                aValue = a.itemName?.toLowerCase() || '';
                bValue = b.itemName?.toLowerCase() || '';
                break;
            case 'itemGroup':
                aValue = a.itemGroup?.toLowerCase() || '';
                bValue = b.itemGroup?.toLowerCase() || '';
                break;
            case 'netStock':
                aValue = a.netStock || 0;
                bValue = b.netStock || 0;
                break;
            case 'stockUnit':
                aValue = a.stockUnit?.toLowerCase() || '';
                bValue = b.stockUnit?.toLowerCase() || '';
                break;
            case 'lastUpdated':
                aValue = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                bValue = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination calculations (Server-side simulation since we filter client side for now)
    const totalPages = Math.ceil(sortedStockData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // Slice the Sorted Data for Pagination
    const paginatedStock = sortedStockData.slice(startIndex, endIndex);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };



    const headerAction = (
        <div className="flex bg-slate-100 dark:bg-slate-700 dark:bg-slate-800 rounded-lg p-1">
            <button
                onClick={() => setEntryType('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${entryType === 'ALL'
                    ? 'bg-white dark:bg-slate-900 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-200'
                    }`}
            >
                All
            </button>
            <button
                onClick={() => setEntryType('PRODUCTION')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${entryType === 'PRODUCTION'
                    ? 'bg-white dark:bg-slate-900 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-200'
                    }`}
            >
                Production
            </button>
            <button
                onClick={() => setEntryType('MANUAL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${entryType === 'MANUAL'
                    ? 'bg-white dark:bg-slate-900 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-200'
                    }`}
            >
                Manual
            </button>
        </div>
    );

    return (
        <Layout activePage="stock" headerAction={headerAction}>
            <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">
                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">

                            {/* Left Side: Filter Button (Mobile) & Search */}
                            <div className="flex gap-2 items-center w-full md:w-auto md:flex-1">
                                <button
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:bg-slate-800 md:hidden bg-white dark:bg-slate-900 shrink-0"
                                    onClick={() => setFilterOpen(!filterOpen)}
                                >
                                    <Filter size={20} className="text-slate-600 dark:text-slate-400" />
                                </button>

                                {/* Search Input - Grows to fill available space on left */}
                                <div className="relative flex-1 md:max-w-xl">
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-3 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Right Side: Action Buttons */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                <div className="hidden md:flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-sm">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700'
                                            }`}
                                        title="List View"
                                    >
                                        <List size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700'
                                            }`}
                                        title="Grid View"
                                    >
                                        <Grid size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500 whitespace-nowrap hidden lg:inline">Rows:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (val > 0) setItemsPerPage(val);
                                        }}
                                        className="hidden md:block w-20 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Rows"
                                    />
                                </div>

                                <button
                                    onClick={handleExport}
                                    className="flex flex-1 md:flex-none items-center justify-center px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 font-medium text-sm transition-colors shadow-sm active:scale-95"
                                >
                                    <Download size={16} className="mr-2" /> Export
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filters Drawer */}
                    {filterOpen && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm md:hidden animate-in slide-in-from-top-2">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Filters</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <select className="p-2 border rounded text-sm bg-slate-50 dark:bg-slate-800"><option>All Groups</option></select>
                                <select className="p-2 border rounded text-sm bg-slate-50 dark:bg-slate-800"><option>Sort by Qty</option></select>
                            </div>
                        </div>
                    )}

                    {/* Desktop Views */}
                    {viewMode === 'list' ? (
                        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                        <th
                                            className="p-4 cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                                            onClick={() => handleSort('itemName')}
                                        >
                                            Item Details
                                        </th>
                                        <th
                                            className="p-4 cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                                            onClick={() => handleSort('itemGroup')}
                                        >
                                            Group
                                        </th>
                                        <th
                                            className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                                            onClick={() => handleSort('netStock')}
                                        >
                                            Qty
                                        </th>
                                        <th
                                            className="p-4 cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                                            onClick={() => handleSort('stockUnit')}
                                        >
                                            Unit
                                        </th>
                                        <th
                                            className="p-4 text-right cursor-pointer hover:bg-slate-100 dark:bg-slate-700 transition-colors"
                                            onClick={() => handleSort('lastUpdated')}
                                        >
                                            Last Updated
                                        </th>
                                        <th className="p-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        [1, 2, 3, 4].map(i => (
                                            <tr key={i}>
                                                <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                                                <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                                <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                                                <td className="p-4"><Skeleton className="h-6 w-12 ml-auto" /></td>
                                                <td className="p-4"><Skeleton className="h-6 w-8" /></td>
                                                <td className="p-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                                                <td className="p-4"></td>
                                            </tr>
                                        ))
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-red-600">
                                                <p className="font-semibold">Error loading stock data</p>
                                                <p className="text-sm text-slate-500 mt-1">{error}</p>
                                                <button onClick={fetchStockData} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                                                    Retry
                                                </button>
                                            </td>
                                        </tr>
                                    ) : sortedStockData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                                No scrap stock items found. Create scrap entries to see stock here.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedStock.map((stock) => (
                                            <tr key={`${stock.itemId}-${stock.itemCode}`} className="hover:bg-slate-50 dark:bg-slate-800 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-800 dark:text-slate-100">{stock.itemName}</div>
                                                    <div className="text-xs text-slate-500">{stock.itemCode}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">{stock.itemGroup}</span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-100">
                                                    {formatNumber(stock.netStock)}
                                                    {/* Show KG equivalent for PCS unit */}
                                                    {stock.stockUnit?.toUpperCase() === 'PCS' && stock.wtPerPacking && (
                                                        <div className="text-xs text-slate-500 mt-1">
                                                            ({formatNumber(stock.netStock * stock.wtPerPacking)} KG)
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                                                        {stock.stockUnit || 'KG'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right text-sm text-slate-500">
                                                    {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString() : '-'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <Link
                                                        href={`/scrap/ledger?itemId=${stock.itemId}`}
                                                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group-hover:opacity-100 opacity-0"
                                                        title="View History"
                                                    >
                                                        <History size={18} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loading ? (
                                [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
                            ) : error ? (
                                <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-8 text-red-700 text-center">
                                    <p className="font-semibold">Error loading stock data</p>
                                    <p className="text-sm mt-1">{error}</p>
                                    <button onClick={fetchStockData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                                        Retry
                                    </button>
                                </div>
                            ) : sortedStockData.length === 0 ? (
                                <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                    No scrap stock items found. Create scrap entries to see stock here.
                                </div>
                            ) : (
                                paginatedStock.map((stock) => (
                                    <div key={`${stock.itemId}-grid`} className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">{stock.itemName}</h3>
                                                <p className="text-xs text-slate-500">{stock.itemCode}</p>
                                            </div>
                                            <Link
                                                href={`/scrap/ledger?itemId=${stock.itemId}`}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <History size={18} />
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                                                {stock.itemGroup}
                                            </span>
                                        </div>
                                        {(stock.gsm || stock.thickness || stock.width) && (
                                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 hidden">
                                                {stock.gsm && <span>{stock.gsm} GSM</span>}
                                                {stock.thickness && <span> {stock.thickness} mic</span>}
                                                {stock.width && <span> {stock.width}mm</span>}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div>
                                                <div className="text-2xl font-bold text-blue-600">{formatNumber(stock.netStock)}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {stock.stockUnit || 'KG'} Available
                                                </div>
                                                {/* Show KG equivalent for PCS unit */}
                                                {stock.stockUnit?.toUpperCase() === 'PCS' && stock.wtPerPacking && (
                                                    <div className="text-xs text-green-600 font-medium mt-1">
                                                        = {formatNumber(stock.netStock * stock.wtPerPacking)} KG
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right text-xs text-slate-400">
                                                Updated<br />
                                                {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString() : '-'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Mobile Card View */}
                    <div className="md:hidden grid grid-cols-1 gap-3">
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
                                <p className="font-semibold">Error loading stock data</p>
                                <p className="text-sm mt-1">{error}</p>
                                <button onClick={fetchStockData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                                    Retry
                                </button>
                            </div>
                        ) : sortedStockData.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                                No stock items found
                            </div>
                        ) : (
                            paginatedStock.map((stock) => (
                                <div key={`${stock.itemId}-mobile`} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex justify-between items-center active:scale-[0.99] transition-transform">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{stock.itemCode}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{stock.itemGroup}</span>
                                        </div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-tight mb-1">{stock.itemName}</h3>
                                        <div className="text-xs text-slate-400">
                                            Updated: {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleString() : '-'}
                                        </div>
                                    </div>
                                    <div className="text-right pl-4 border-l border-slate-100">
                                        <div className="text-xl font-bold text-blue-600">{formatNumber(stock.netStock)}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{stock.stockUnit || 'KG'} Available</div>
                                        {/* Show KG equivalent for PCS unit */}
                                        {stock.stockUnit?.toUpperCase() === 'PCS' && stock.wtPerPacking && (
                                            <div className="text-xs text-green-600 font-medium mt-1">
                                                = {formatNumber(stock.netStock * stock.wtPerPacking)} KG
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {!loading && !error && sortedStockData.length > 0 && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Showing {startIndex + 1} to {Math.min(endIndex, sortedStockData.length)} of {sortedStockData.length} items
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg border transition-colors ${currentPage === 1
                                        ? 'border-slate-200 dark:border-slate-800 text-slate-300 cursor-not-allowed'
                                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
                                        }`}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {getPageNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page as number)}
                                            className={`px-3 py-2 rounded-lg border transition-colors ${currentPage === page
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg border transition-colors ${currentPage === totalPages
                                        ? 'border-slate-200 dark:border-slate-800 text-slate-300 cursor-not-allowed'
                                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800'
                                        }`}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};
