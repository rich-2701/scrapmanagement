'use client';

import React, { useState, useEffect } from 'react';
import { Search, Scale, ChevronDown, CheckCircle, Package } from 'lucide-react';
import { SCRAP_REASONS } from '@/lib/constants';
import { MaterialItem, Unit, ItemGroup } from '@/lib/types';
import { calculateScrapWeight, formatNumber } from '@/lib/utils';
import { VisualEvidenceUpload } from '@/components/VisualEvidenceUpload';
import { Skeleton } from '@/components/Skeleton';
import { ScrapEntryTabs } from '@/components/pages/ScrapEntryTabs';
import { Layout } from '@/components/Layout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export const ManualScrap: React.FC = () => {
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [allMaterials, setAllMaterials] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehousesLoading, setWarehousesLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedWhName, setSelectedWhName] = useState<string>('');
    const [evidenceImage, setEvidenceImage] = useState<File | null>(null);

    useEffect(() => {
        fetchAllMaterials();
        fetchWarehouses();
    }, []);

    // Refetch warehouses when production unit changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'selectedProductionUnitId') {
                console.log('Production unit changed, refetching warehouses...');
                fetchWarehouses();
            }
        };

        // Listen for storage events (from other tabs/windows)
        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom event (from same tab)
        const handleProductionUnitChange = () => {
            console.log('Production unit changed (same tab), refetching warehouses...');
            fetchWarehouses();
        };
        window.addEventListener('productionUnitChanged', handleProductionUnitChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('productionUnitChanged', handleProductionUnitChange);
        };
    }, []);

    const fetchAllMaterials = async () => {
        try {
            setLoading(true);
            setError('');
            const { scrapApi } = await import('@/lib/api');
            const result = await scrapApi.getMaterials();

            if (result.success && result.data) {
                setAllMaterials(Array.isArray(result.data) ? result.data : []);
            } else {
                setError('Failed to load materials');
            }
        } catch (err: any) {
            console.error('Materials fetch error:', err);
            setError(err.message || 'Failed to load materials');
        } finally {
            setLoading(false);
        }
    };

    const fetchWarehouses = async () => {
        try {
            setWarehousesLoading(true);

            // Small delay to ensure backend session is updated after production unit change
            await new Promise(resolve => setTimeout(resolve, 300));

            const { apiClient } = await import('@/lib/api');
            // Updated to use the new production-unit-filtered warehouse endpoint
            const result = await apiClient.get('/api/scrap/warehouses');

            console.log('Warehouse API Response:', result);

            if (result.success && result.data) {
                console.log('Warehouses data:', result.data);
                setWarehouses(Array.isArray(result.data) ? result.data : []);
            } else {
                console.warn('No warehouse data received or API call unsuccessful');
            }
        } catch (err: any) {
            console.error('Warehouses fetch error:', err);
        } finally {
            setWarehousesLoading(false);
        }
    };

    // Filter out items where IsScrap === 1 (scrap items by nature), keep all other items
    // Note: Backend API must include IsScrap field in response for this filter to work
    const nonScrapMaterials = allMaterials.filter(i => {
        // Check for IsScrap = 1 in various formats (number, string, boolean)
        const isScrapFlag = i.IsScrap ?? i.isScrap;
        // If IsScrap field is not present (undefined), show the item
        if (isScrapFlag === undefined || isScrapFlag === null) {
            return true;
        }
        // Only hide items where IsScrap is explicitly 1
        return isScrapFlag !== 1 && isScrapFlag !== '1' && isScrapFlag !== true;
    });

    // Show all non-scrap items if search is empty, otherwise filter by search
    const filteredItems = search
        ? nonScrapMaterials.filter(i => {
            const itemName = (i.name || i.itemName || '').toLowerCase();
            const itemCode = (i.code || i.itemCode || '').toLowerCase();
            const itemGroup = (i.itemGroup || '').toLowerCase();
            const searchLower = search.toLowerCase();

            return itemName.includes(searchLower) ||
                itemCode.includes(searchLower) ||
                itemGroup.includes(searchLower);
        })
        : nonScrapMaterials;

    // Calculate weight for paper items when unit is SHEET
    const calculateWeight = () => {
        const isPaper = selectedItem?.itemGroup?.toUpperCase().includes('PAPER');
        const isSheetUnit = formData.unit?.toUpperCase() === 'SHEET';
        const isPcsUnit = formData.unit?.toUpperCase() === 'PCS';

        if (isPaper && isSheetUnit && formData.width && formData.length && formData.sheets && selectedItem?.gsm) {
            // Formula: length * width * gsm * sheets / 1000000000
            return (formData.length * formData.width * selectedItem.gsm * formData.sheets) / 1000000000;
        }

        // Calculate weight for PCS unit: wtPerPacking * numberOfPcs
        if (isPcsUnit && formData.wtPerPacking && formData.numberOfPcs) {
            return formData.wtPerPacking * formData.numberOfPcs;
        }

        return 0;
    };

    // Determine display quantity based on item type and unit
    const calculatedWeight = calculateWeight();
    const isPaper = selectedItem?.itemGroup?.toUpperCase().includes('PAPER');
    const isSheetUnit = formData.unit?.toUpperCase() === 'SHEET';
    const isPcsUnit = formData.unit?.toUpperCase() === 'PCS';

    const displayQty = (isPaper && isSheetUnit) || isPcsUnit
        ? calculatedWeight  // For paper with sheet unit or PCS unit, show calculated KG
        : (formData.qty || 0); // For all other cases, show entered quantity

    const displayUnit = (isPaper && isSheetUnit) || isPcsUnit ? 'KG' : (formData.unit || 'KG');

    // Validation: check if valid entry exists
    const hasValidEntry = (isPaper && isSheetUnit) || isPcsUnit
        ? (calculatedWeight > 0)  // For paper sheets or PCS, weight must be calculated
        : (formData.qty > 0);      // For KG entry, quantity must be entered

    const [submitting, setSubmitting] = useState(false);

    const handleSelect = (item: any) => {
        setSelectedItem(item);
        setSearch('');

        // Check if item is paper to set default unit
        const isPaper = item.itemGroup?.toUpperCase().includes('PAPER');
        setFormData(isPaper ? { unit: 'Sheet' } : {});
    };

    const handleSubmit = async () => {
        if (!selectedItem || !hasValidEntry) return;

        // Validate mandatory fields
        const missingFields: string[] = [];

        if (!formData.unit) {
            missingFields.push('Unit');
        }

        if (!formData.warehouseId) {
            missingFields.push('Warehouse');
        }

        if (!formData.reason) {
            missingFields.push('Reason');
        }

        // If there are missing fields, show alert and return
        if (missingFields.length > 0) {
            alert(`Please fill in the following mandatory fields:\n\n${missingFields.map(f => `• ${f}`).join('\n')}`);
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const { scrapApi } = await import('@/lib/api');

            const entryData = {
                materialId: selectedItem.id, // Corrected property name from itemId to id
                inputQty: (isPaper && isSheetUnit) ? Number(formData.sheets) : (isPcsUnit ? Number(formData.numberOfPcs) : displayQty),
                inputUnit: formData.unit,
                source: 'MANUAL',
                reason: formData.reason === 'Other' ? formData.customReason : formData.reason,
                warehouseId: formData.warehouseId || null,
                params: { // Wrap params in params object as per backend
                    ...formData,
                    wtPerPacking: isPcsUnit ? Number(formData.wtPerPacking) : undefined,
                    numberOfPcs: isPcsUnit ? Number(formData.numberOfPcs) : undefined,
                }
            };

            const result = await scrapApi.createEntry(entryData);

            if (result.success) {
                // success reset
                setSelectedItem(null);
                setFormData({});
                setEvidenceImage(null);
                setSelectedWhName('');
                alert('Scrap entry submitted successfully!');
            } else {
                setError(result.message || 'Failed to submit entry');
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Error submitting entry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout activePage="entry" headerAction={<ScrapEntryTabs />}>
            <div className="h-full bg-gray-50 dark:bg-slate-950">

                {/* Main Content */}
                <div className="p-6 pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Selection & Form */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Item Search */}
                            {!selectedItem ? (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Select Material</label>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Type to search material code or name..."
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {loading ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <Skeleton key={i} className="h-16 w-full rounded-lg mb-2" />
                                            ))
                                        ) : error ? (
                                            <div className="text-center py-10">
                                                <p className="text-red-600 font-semibold">Error loading materials</p>
                                                <p className="text-sm text-slate-500 mt-1">{error}</p>
                                                <button onClick={fetchAllMaterials} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                                                    Retry
                                                </button>
                                            </div>
                                        ) : filteredItems.length > 0 ? (
                                            filteredItems.map((item, index) => (
                                                <button
                                                    key={item.uniqueId || `material-${index}`}
                                                    onClick={() => handleSelect(item)}
                                                    className="w-full text-left p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all group bg-slate-50 dark:bg-slate-800/50 mb-2"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{item.displayName || item.name || item.itemName}</span>
                                                        <span className="text-xs bg-slate-100 dark:bg-slate-700 group-hover:bg-white dark:group-hover:bg-slate-600 px-2 py-1 rounded text-slate-500 dark:text-slate-400">{item.code || item.itemCode}</span>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-center py-10">
                                                <p className="text-slate-400">No materials found{search ? ` matching "${search}"` : ''}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Selected Item Form */
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedItem.itemName}</h3>
                                            <div className="flex space-x-2 mt-1">
                                                <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium border border-blue-100 dark:border-blue-800">{selectedItem.itemCode}</span>
                                                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full font-medium">{selectedItem.itemGroup}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            Change Material
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Unit Selector */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Entry Unit <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none transition-all text-slate-900 dark:text-slate-100"
                                                    onChange={(e) => {
                                                        const unit = e.target.value;
                                                        const isPcsUnit = unit.toUpperCase() === 'PCS';

                                                        setFormData({
                                                            ...formData,
                                                            unit,
                                                            // Auto-populate weight per packing from database if available
                                                            wtPerPacking: isPcsUnit && selectedItem?.wtPerPacking
                                                                ? selectedItem.wtPerPacking
                                                                : formData.wtPerPacking
                                                        });
                                                    }}
                                                    value={formData.unit || ''}
                                                >
                                                    <option value="">Select Unit</option>
                                                    {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>

                                        {/* Warehouse Selector - Searchable */}
                                        {/* Warehouse Name Selector - Unique */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Warehouse <span className="text-red-500">*</span></label>
                                            <SearchableSelect
                                                options={Array.from(new Set(warehouses.map(w => w.warehouseName))).filter(Boolean).sort().map(name => ({
                                                    value: name,
                                                    label: name
                                                }))}
                                                value={selectedWhName}
                                                onChange={(value) => {
                                                    setSelectedWhName(value);
                                                    setFormData({ ...formData, warehouseId: null });
                                                }}
                                                placeholder="Select Warehouse"
                                            />
                                        </div>

                                        {/* Bin Selector - Dependent on Warehouse */}
                                        {selectedWhName && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Bin / Location</label>
                                                <SearchableSelect
                                                    options={warehouses
                                                        .filter(w => w.warehouseName === selectedWhName)
                                                        .map(w => ({
                                                            value: w.warehouseId,
                                                            label: w.warehouseBinName || w.binName || w.warehouseName
                                                        }))}
                                                    value={formData.warehouseId || ''}
                                                    onChange={(value) => setFormData({ ...formData, warehouseId: Number(value) })}
                                                    placeholder="Select Bin"
                                                />
                                            </div>
                                        )}

                                        {/* Dynamic Inputs */}
                                        {isPaper && isSheetUnit ? (
                                            /* Paper with Sheet unit: Show Width, Length, Sheets */
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Width (mm)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.width || ''}
                                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                                        onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Length (mm)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.length || ''}
                                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                                        onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Total Sheets</label>
                                                    <input
                                                        type="number"
                                                        value={formData.sheets || ''}
                                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                                        onChange={(e) => setFormData({ ...formData, sheets: Number(e.target.value) })}
                                                    />
                                                </div>
                                                {calculatedWeight > 0 && (
                                                    <div className="col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                                        <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Calculated Weight</p>
                                                        <p className="text-lg font-bold text-blue-700 dark:text-blue-200">{calculatedWeight.toFixed(3)} KG</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : isPcsUnit ? (
                                            /* PCS unit: Show Weight per Pcs and Number of Pcs */
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Per Pcs Weight (KG)</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={formData.wtPerPacking || ''}
                                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                                        onChange={(e) => setFormData({ ...formData, wtPerPacking: Number(e.target.value) })}
                                                        placeholder="Enter weight per piece"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">No. of Pcs</label>
                                                    <input
                                                        type="number"
                                                        value={formData.numberOfPcs || ''}
                                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                                        onChange={(e) => setFormData({ ...formData, numberOfPcs: Number(e.target.value) })}
                                                        placeholder="Enter number of pieces"
                                                    />
                                                </div>
                                                {calculatedWeight > 0 && (
                                                    <div className="col-span-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                                        <p className="text-xs text-green-600 dark:text-green-300 font-medium mb-1">Calculated Weight</p>
                                                        <p className="text-lg font-bold text-green-700 dark:text-green-200">{calculatedWeight.toFixed(3)} KG</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* KG unit or non-paper items: Show Quantity field */
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">Quantity ({formData.unit || 'KG'})</label>
                                                <input
                                                    type="number"
                                                    value={formData.qty || ''}
                                                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                                    onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Reason <span className="text-red-500">*</span></label>
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <select
                                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none text-slate-900 dark:text-slate-100"
                                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                        value={formData.reason || ''}
                                                    >
                                                        <option value="">Select Reason</option>
                                                        {SCRAP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                                {formData.reason === 'Other' && (
                                                    <input
                                                        type="text"
                                                        className="w-full p-2.5 bg-white dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all animate-in fade-in slide-in-from-top-1 text-slate-900 dark:text-slate-100"
                                                        placeholder="Please specify the reason..."
                                                        onChange={(e) => setFormData({ ...formData, customReason: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <VisualEvidenceUpload
                                                onImageSelect={setEvidenceImage}
                                                value={evidenceImage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Preview & Submit */}
                        <div className="space-y-4">
                            <div className={`
              p-6 rounded-lg border shadow-sm transition-all duration-300 flex flex-col items-center text-center justify-center min-h-[200px]
              bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100
            `}>
                                <Scale size={32} className="mb-3 text-blue-600 dark:text-blue-400" />
                                <p className="text-sm font-medium mb-1 opacity-90 text-slate-500 dark:text-slate-400">Total Scrap Quantity</p>
                                <div className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    {formatNumber(displayQty)} <span className="text-lg font-normal opacity-80 text-slate-500 dark:text-slate-400">{displayUnit}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!hasValidEntry || submitting}
                                className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-[0.98]"
                            >
                                {submitting ? (
                                    <span className="animate-spin mr-2">⏳</span>
                                ) : (
                                    <CheckCircle className="mr-2" size={20} />
                                )}
                                {submitting ? 'Submitting...' : 'Submit Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};