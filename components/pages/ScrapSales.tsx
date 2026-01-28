'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle2, ShoppingCart, Search, Grid, List, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { ScrapSalesTabs } from '@/components/pages/ScrapSalesTabs';
import { Layout } from '@/components/Layout';

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  align: 'left' | 'center' | 'right';
}

export const ScrapSales: React.FC = () => {
  const router = useRouter();
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [saleForm, setSaleForm] = useState({ quantity: '', price: '', buyer: '', invoice: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [activeTab, setActiveTab] = useState<'all' | 'production' | 'manual'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Column resizing state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'select', label: '', width: 48, minWidth: 48, align: 'center' },
    { key: 'itemName', label: 'Material', width: 250, minWidth: 150, align: 'left' },
    { key: 'itemCode', label: 'Code', width: 100, minWidth: 80, align: 'left' },
    { key: 'itemGroup', label: 'Group', width: 120, minWidth: 100, align: 'left' },
    { key: 'netStock', label: 'Available', width: 150, minWidth: 120, align: 'right' },
    { key: 'lastUpdated', label: 'Last Updated', width: 160, minWidth: 140, align: 'right' },
  ]);

  const tableRef = useRef<HTMLTableElement>(null);
  const resizingColumn = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  // Column resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    resizingColumn.current = {
      index: columnIndex,
      startX: e.clientX,
      startWidth: columns[columnIndex].width
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columns]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn.current) return;

      const { index, startX, startWidth } = resizingColumn.current;
      const diff = e.clientX - startX;
      const newWidth = Math.max(columns[index].minWidth, startWidth + diff);

      setColumns(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], width: newWidth };
        return updated;
      });
    };

    const handleMouseUp = () => {
      resizingColumn.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [columns]);


  useEffect(() => {
    // Reset page and selections when switching tabs
    setCurrentPage(1);
    setSelectedItems(new Set());
    fetchStock();
  }, [activeTab]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError('');
      const { scrapApi } = await import('@/lib/api');

      let entryType: string | undefined;

      if (activeTab === 'production') {
        entryType = 'PRODUCTION';
      } else if (activeTab === 'manual') {
        entryType = 'MANUAL';
      } else {
        entryType = undefined; // 'all' tab - don't filter by entry type
      }

      const result = await scrapApi.getStock(undefined, entryType);

      if (result.success && result.data) {
        setStockData(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err: any) {
      console.error('Stock fetch error:', err);
      setError(err.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const selectedStockItem = stockData.find(s => s.itemId === selectedStockId);

  // Filter stock data
  const filteredData = stockData.filter(s =>
    !searchQuery ||
    s.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.itemGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Handle Sort Click
  const handleHeaderClick = (key: string) => {
    // Prevent sorting by 'select' column
    if (key === 'select') return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleCreateInvoice = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to create invoice');
      return;
    }

    const itemIds = Array.from(selectedItems).join(',');
    router.push(`/scrap/sales/invoice?items=${itemIds}`);
  };

  const handleSale = async () => {
    if (!selectedStockItem || !saleForm.buyer || !saleForm.quantity || !saleForm.price) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const { scrapApi } = await import('@/lib/api');

      const saleData = {
        buyerName: saleForm.buyer,
        invoiceNo: saleForm.invoice || undefined,
        items: [{
          materialId: selectedStockItem.itemId,
          qtyKg: parseFloat(saleForm.quantity),
          ratePerKg: parseFloat(saleForm.price)
        }]
      };

      const result = await scrapApi.createSale(saleData);

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSelectedStockId(null);
          setSaleForm({ quantity: '', price: '', buyer: '', invoice: '' });
          fetchStock(); // Refresh stock
        }, 2500);
      } else {
        alert(result.message || 'Failed to create sale');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create sale');
    }
  };

  return (
    <Layout activePage="sales" headerAction={<ScrapSalesTabs activeTab={activeTab} onTabChange={setActiveTab} />}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6 pb-24 md:pb-0">
          {/* Success Notification */}
          {showSuccess && (
            <div className="fixed top-20 right-5 z-[100] bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center animate-in slide-in-from-right-5 fade-in border border-green-500">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-bold">Sale Confirmed!</h4>
                <p className="text-xs text-green-100 mt-0.5">Invoice generated successfully.</p>
              </div>
            </div>
          )}

          {/* Header - Selected Items and Create Invoice Button */}
          {selectedItems.size > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-blue-600 text-sm font-medium">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </p>
              <button
                onClick={handleCreateInvoice}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors shadow-sm"
              >
                <FileText size={16} className="mr-2" /> Create Invoice ({selectedItems.size})
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search materials..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Items per page:</label>
              <input
                type="number"
                min="1"
                value={itemsPerPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0) setItemsPerPage(val);
                }}
                className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 border-none outline-none focus:ring-1 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-300"
              />
            </div>
            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700'
                  }`}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700'
                  }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Display Content */}
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)
              ) : error ? (
                <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-8 text-center text-red-700">
                  <p className="font-semibold">Error loading stock</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button onClick={fetchStock} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                    Retry
                  </button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No scrap stock available for sale</p>
                </div>
              ) : (
                paginatedData.map((stock: any) => (
                  <div
                    key={stock.itemId}
                    className={`
                bg-white dark:bg-slate-900 p-5 rounded-lg border-2 shadow-sm cursor-pointer transition-all relative
                ${selectedItems.has(stock.itemId)
                        ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20 shadow-md bg-green-50/30 dark:bg-green-900/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'}
              `}
                  >
                    {/* Checkbox for multiple selection */}
                    <div className="absolute top-3 right-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(stock.itemId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleItemSelection(stock.itemId);
                        }}
                        className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                      />
                    </div>

                    <div className="pr-8">
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">{stock.itemCode}</span>
                        <span className="text-xs text-slate-400">{stock.itemGroup}</span>
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-3">{stock.itemName}</h3>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">Available</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(stock.netStock)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {stock.stockUnit || 'KG'}
                            {stock.stockUnit?.toUpperCase() === 'PCS' && stock.wtPerPacking && (
                              <span className="text-green-600"> = {formatNumber(stock.netStock * stock.wtPerPacking)} KG</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* List View */
            /* List View with Resizable Columns */
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
              <table className="border-collapse w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                    {columns.map((column, index) => (
                      <th
                        key={column.key}
                        className={`relative p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${column.key !== 'select' ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`}
                        onClick={() => handleHeaderClick(column.key)}
                        style={{
                          width: `${column.width}px`,
                          minWidth: `${column.minWidth}px`,
                          maxWidth: `${column.width}px`,
                          textAlign: column.align,
                        }}
                      >
                        <div className="flex items-center gap-1 justify-between">
                          {column.key === 'select' ? (
                            <input
                              type="checkbox"
                              checked={paginatedData.length > 0 && paginatedData.every((s: any) => selectedItems.has(s.itemId))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  paginatedData.forEach((s: any) => selectedItems.add(s.itemId));
                                  setSelectedItems(new Set(selectedItems));
                                } else {
                                  paginatedData.forEach((s: any) => selectedItems.delete(s.itemId));
                                  setSelectedItems(new Set(selectedItems));
                                }
                              }}
                              className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                            />
                          ) : (
                            <span>{column.label}</span>
                          )}

                          {/* Sort Indicator */}
                          {sortConfig?.key === column.key && (
                            <span className="text-slate-400">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>

                        {/* Resize Handle */}
                        {index < columns.length - 1 && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-10"
                            onMouseDown={(e) => handleMouseDown(e, index)}
                            style={{ marginRight: '-2px' }}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td colSpan={columns.length} className="p-4"><Skeleton className="h-10 w-full" /></td>
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={columns.length} className="p-8 text-center text-red-600">
                        <p>{error}</p>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="p-12 text-center text-slate-400">
                        <p>No scrap stock available for sale</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((stock: any) => (
                      <tr
                        key={stock.itemId}
                        className={`transition-colors border-b border-slate-100 dark:border-slate-800 ${selectedItems.has(stock.itemId) ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className="p-3 text-sm truncate"
                            style={{
                              width: `${column.width}px`,
                              minWidth: `${column.minWidth}px`,
                              maxWidth: `${column.width}px`,
                              textAlign: column.align,
                            }}
                          >
                            {column.key === 'select' ? (
                              <input
                                type="checkbox"
                                checked={selectedItems.has(stock.itemId)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleItemSelection(stock.itemId);
                                }}
                                className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                              />
                            ) : column.key === 'itemName' ? (
                              <div className="font-medium text-slate-800 dark:text-slate-100" title={stock.itemName}>{stock.itemName}</div>
                            ) : column.key === 'itemCode' ? (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded">{stock.itemCode}</span>
                            ) : column.key === 'itemGroup' ? (
                              <span className="text-slate-600 dark:text-slate-400">{stock.itemGroup}</span>
                            ) : column.key === 'netStock' ? (
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-800 dark:text-slate-100">{formatNumber(stock.netStock)}</span>
                                <span className="text-xs text-slate-500">{stock.stockUnit || 'KG'}</span>
                                {stock.stockUnit?.toUpperCase() === 'PCS' && stock.wtPerPacking && (
                                  <span className="text-[10px] text-green-600">= {formatNumber(stock.netStock * stock.wtPerPacking)} KG</span>
                                )}
                              </div>
                            ) : column.key === 'lastUpdated' ? (
                              <span className="text-slate-500 text-xs">{stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleDateString() : '-'}</span>
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && filteredData.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[36px] px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 py-1.5">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Sale Form Modal */}
          {selectedStockItem && (
            <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4" onClick={() => setSelectedStockId(null)}>
              <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{selectedStockItem.itemName}</h3>
                    <p className="text-sm text-slate-500">
                      Available: {formatNumber(selectedStockItem.netStock)} {selectedStockItem.stockUnit || 'KG'}
                      {selectedStockItem.stockUnit?.toUpperCase() === 'PCS' && selectedStockItem.wtPerPacking && (
                        <span className="text-green-600 font-medium"> = {formatNumber(selectedStockItem.netStock * selectedStockItem.wtPerPacking)} KG</span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => setSelectedStockId(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Buyer Name *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={saleForm.buyer}
                      onChange={(e) => setSaleForm({ ...saleForm, buyer: e.target.value })}
                      placeholder="Enter buyer name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Quantity ({selectedStockItem.stockUnit || 'KG'}) *</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                      placeholder="0.00"
                      max={selectedStockItem.netStock}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Price per {selectedStockItem.stockUnit || 'KG'} *</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={saleForm.price}
                      onChange={(e) => setSaleForm({ ...saleForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Invoice Number (Optional)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={saleForm.invoice}
                      onChange={(e) => setSaleForm({ ...saleForm, invoice: e.target.value })}
                      placeholder="INV-001"
                    />
                  </div>

                  {saleForm.quantity && saleForm.price && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-700">
                        ₹{formatNumber(parseFloat(saleForm.quantity) * parseFloat(saleForm.price))}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSale}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all mt-4"
                  >
                    Confirm Sale
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};