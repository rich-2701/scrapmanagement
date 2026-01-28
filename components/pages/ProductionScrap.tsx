'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { scrapApi } from '@/lib/api';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ScrapEntryTabs } from '@/components/pages/ScrapEntryTabs';
import { Layout } from '@/components/Layout';

interface JobContent {
    JobBookingJobCardContentsID: number;
    BookingID: number;
    JobBookingNo: string;
    JobCardNo: string;
    ProductionUnitID: number;
    JobContentsID: number;
    ProcID: number;
    CompanyID: number;
    PlanType: string;
    ChkPaperByClient: boolean;
    HasScrap: boolean;
}

interface ProductionDetail {
    PaperID: number;
    ItemGroupNameID: number;
    ItemCode: string;
    ItemName: string;
    Quality: string;
    GSM: number;
    ReleaseGSM: number;
    AdhesiveGSM: number;
    Thickness: number;
    Density: number;
    Manufecturer: string;
    Finish: string;
    SizeW: number;
    SizeL: number;
    VoucherNo: string;
    VoucherDate: string;
    BatchNo: string;
    BatchID: number;
    SupplierBatchNo: string;
    PaperSizeL: number;
    PaperSizeW: number;
    CutSizeW: number;
    CutSizeL: number;
    CutSize: string;
    IssueSheets: number;
    IssueQuantity: number;
    ConsumeSheets: number;
    ConsumedQuantity: number;
    ConsumeQuantity: number;
    RemainingPaper: number;
    RemainingQuantity: number;
    IssueTransactionID: number;
    GRNTransactionID: number;
    StockUnit: string;
    FloorWarehouseID: number;
    DepartmentID: number;
    DepartmentName: string;
    WarehouseName: string;
    BinName: string;
    ProductionUnitName: string;
    // Added fields for Round 2
    ProductHSNID: number;
    ProductHSNName: string;
    ItemSubGroupID: number;
    WtPerPacking: number;
    EstimationUnit: string;
    PurchaseUnit: string;
    PackingType: string;
    StockCategory: string;
    EstimationRate: number;
    PurchaseRate: number;
}

interface ScrapItem {
    id: string;
    paperCode: string;
    quality: string;
    size: string;
    gsm: number;
    mill: string;
    finish: string;
    balancePieceL: number;
    balancePieceW: number;
    qtySheets: number;
    qtyKg: number;
    materialSize: string;
    status: 'Stock' | 'Scrap';
    // Additional fields for ItemMaster creation
    itemGroupId: number;
    sizeW: number;
    sizeL: number;
    thickness: number;
    density: number;
    itemSize: string;
    // Warehouse and stock fields
    floorWarehouseID: number;
    warehouseName: string;
    stockUnit: string;
    // Round 2 Fields
    ProductHSNID: number;
    ItemSubGroupID: number;
    WtPerPacking: number;
    EstimationUnit: string;
    PurchaseUnit: string;
    PackingType: string;
    StockCategory: string;
    EstimationRate: number;
    PurchaseRate: number;
    ItemGroupNameID: number; // Added explicitly to pass to backend logic
    PaperID: number; // Added for ExItemID
    jobBookingId: number;
}

export const ProductionScrap: React.FC = () => {
    const router = useRouter();

    // Master Data
    const [jobContents, setJobContents] = useState<JobContent[]>([]);
    const [productionDetails, setProductionDetails] = useState<ProductionDetail[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Selected State
    const [selectedContentId, setSelectedContentId] = useState<number>(0);
    const [selectedContent, setSelectedContent] = useState<JobContent | null>(null);
    const [selectedDetailIndex, setSelectedDetailIndex] = useState<number>(-1);

    // Form State
    const [balancePieceW, setBalancePieceW] = useState<number>(0);
    const [balancePieceL, setBalancePieceL] = useState<number>(0);
    const [qtySheets, setQtySheets] = useState<number>(0);
    const [qtyKg, setQtyKg] = useState<number>(0);
    const [status, setStatus] = useState<'Stock' | 'Scrap'>('Scrap');

    // Added Items List
    const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);

    // Messages
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Check authentication on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const companyUser = localStorage.getItem('scrap_company_user');
            const companyPass = localStorage.getItem('scrap_company_pass');
            const userName = localStorage.getItem('scrap_user_name');
            const userPass = localStorage.getItem('scrap_user_pass');

            if (companyUser && companyPass && userName && userPass) {
                setIsAuthenticated(true);
            } else {
                // Redirect to login if not authenticated
                router.push('/login');
            }
        }
    }, [router]);

    // Load all job contents only after authentication is confirmed
    useEffect(() => {
        if (isAuthenticated) {
            loadAllJobContents();
        }
    }, [isAuthenticated]);

    // Load production details when content is selected
    useEffect(() => {
        if (selectedContentId > 0) {
            const content = jobContents.find(c => c.JobBookingJobCardContentsID === selectedContentId);
            setSelectedContent(content || null);

            if (content) {
                loadProductionDetails(content);
            }
        } else {
            setSelectedContent(null);
            setProductionDetails([]);
        }
    }, [selectedContentId, jobContents]);

    // Determine if selected item is a Reel (starts with 'R')
    const isReel = selectedDetailIndex >= 0 &&
        productionDetails[selectedDetailIndex]?.ItemCode?.startsWith('R');

    // Auto-calculate Qty(Kg) when Balance Piece L, W, Qty(Sheets), or selected row changes
    // For Reels (isReel), we allow manual entry, so we skip auto-calc.
    useEffect(() => {
        if (isReel) {
            // Do not auto-calculate for Reels
            return;
        }

        if (balancePieceL > 0 && balancePieceW > 0 && qtySheets > 0) {
            // Get GSM from selected row, or from first row if no row is selected
            let gsm = 0;

            if (selectedDetailIndex >= 0 && productionDetails[selectedDetailIndex]) {
                gsm = productionDetails[selectedDetailIndex].GSM || 0;
            } else if (productionDetails.length > 0) {
                gsm = productionDetails[0].GSM || 0;
            }

            if (gsm > 0) {
                // Formula: (Balance Length * Balance Width * GSM * Qty(Sheets)) / 1000000000
                const calculatedQtyKg = (balancePieceL * balancePieceW * gsm * qtySheets) / 1000000000;
                setQtyKg(parseFloat(calculatedQtyKg.toFixed(4))); // Round to 4 decimal places
                console.log(`Auto-calculated Qty(Kg): Balance L=${balancePieceL}, Balance W=${balancePieceW}, GSM=${gsm}, Sheets=${qtySheets}, Result=${calculatedQtyKg.toFixed(4)}`);
            } else {
                console.log('Cannot calculate Qty(Kg): GSM not available');
            }
        } else {
            // Reset Qty(Kg) when any required field is 0 (ONLY for non-Reels)
            setQtyKg(0);
        }
    }, [balancePieceL, balancePieceW, qtySheets, selectedDetailIndex, productionDetails, isReel]);

    const loadAllJobContents = async () => {
        try {
            setLoading(true);
            const result = await scrapApi.getAllJobContents();
            if (result.success && Array.isArray(result.data)) {
                const j04666 = result.data.find((j: any) => j.JobBookingNo?.includes('J04666'));
                if (j04666) console.log('⚠️ J04666 Found in Dropdown List:', j04666);
                setJobContents(result.data);
            }
        } catch (error: any) {
            console.error('Error loading job contents:', error);

            // Check if it's an authentication error
            if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('authentication')) {
                // Clear invalid credentials and redirect to login
                localStorage.removeItem('scrap_company_user');
                localStorage.removeItem('scrap_company_pass');
                localStorage.removeItem('scrap_user_name');
                localStorage.removeItem('scrap_user_pass');
                router.push('/login');
            } else {
                setErrorMessage('Failed to load job contents');
                setShowError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadProductionDetails = async (content: JobContent) => {
        try {
            setLoading(true);
            console.log('=== Loading production details ===');
            console.log('Content ID:', content.JobBookingJobCardContentsID);
            console.log('Job Booking No:', content.JobBookingNo);
            console.log('Full content object:', content);

            // Use the new optimized endpoint that automatically handles parameter fetching
            const result = await scrapApi.getProductionDetailsByContentId(
                content.JobBookingJobCardContentsID
            );

            console.log('=== API Response Received ===');
            console.log('Full result:', JSON.stringify(result, null, 2));
            console.log('Success:', result.success);
            console.log('Has data:', !!result.data);

            if (result.success && result.data) {
                const data: any = result.data;
                console.log('=== Data structure analysis ===');
                console.log('Data keys:', Object.keys(data));
                console.log('Tables exists:', 'Tables' in data);
                console.log('Tables value:', data.Tables);
                console.log('Tables length:', data.Tables?.length);

                if (data.Tables && data.Tables.length > 0) {
                    const firstTable = data.Tables[0];
                    console.log('=== First table analysis ===');
                    console.log('Table name:', firstTable.TableName);
                    console.log('Has Rows:', 'Rows' in firstTable);
                    console.log('Rows length:', firstTable.Rows?.length);

                    if (firstTable.Rows && firstTable.Rows.length > 0) {
                        console.log('=== Table data preview ===');
                        console.log('First row:', firstTable.Rows[0]);
                        console.log('Row keys:', Object.keys(firstTable.Rows[0]));
                        console.log(`Setting ${firstTable.Rows.length} production details`);
                        setProductionDetails(firstTable.Rows);

                        // Auto-fill Cut Size Length and Width from first row
                        const firstRow = firstTable.Rows[0];
                        if (firstRow.CutSizeL) {
                            setBalancePieceL(firstRow.CutSizeL);
                            console.log('Set Cut Size Length:', firstRow.CutSizeL);
                        }
                        if (firstRow.CutSizeW) {
                            setBalancePieceW(firstRow.CutSizeW);
                            console.log('Set Cut Size Width:', firstRow.CutSizeW);
                        }
                    } else {
                        // No rows - this is a "Ghost" job card (Backend shows it, Frontend SP hides it)
                        // Auto-remove it from the list to resolve the "No Data" issue dynamically
                        console.log('ℹ️ Ghost Job Detected. Removing from list:', content.JobBookingNo);
                        setProductionDetails([]);

                        // Remove from dropdown list
                        setJobContents(prev => prev.filter(j => j.JobBookingJobCardContentsID !== content.JobBookingJobCardContentsID));

                        // Reset Selection
                        setSelectedContentId(0);

                        // Silent Removal - Don't annoy user with error banner
                        // setErrorMessage(`Job Card ${content.JobBookingNo || ''} has no scrap data and was removed.`);
                        // setShowError(true);
                    }
                } else {
                    console.log('⚠️ No tables in response');
                    setErrorMessage('No production data returned from server');
                    setShowError(true);
                    setProductionDetails([]);
                }
            } else {
                console.log('⚠️ API call failed or returned no data');
                console.log('Error message:', result.message);
                console.log('Error details:', result.error);
                setErrorMessage(result.message || 'Failed to load production details');
                setShowError(true);
                setProductionDetails([]);
            }
        } catch (error: any) {
            console.error('=== ERROR loading production details ===');
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);

            // Check if it's an authentication error
            if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('authentication')) {
                // Clear invalid credentials and redirect to login
                localStorage.removeItem('scrap_company_user');
                localStorage.removeItem('scrap_company_pass');
                localStorage.removeItem('scrap_user_name');
                localStorage.removeItem('scrap_user_pass');
                router.push('/login');
            } else {
                setErrorMessage('Failed to load production details: ' + error.message);
                setShowError(true);
                setProductionDetails([]);
            }
        } finally {
            setLoading(false);
            console.log('=== Load complete ===');
        }
    };

    const handleAddItem = () => {
        if (selectedDetailIndex < 0 || !productionDetails[selectedDetailIndex]) {
            setErrorMessage('Please select a row from the table');
            setShowError(true);
            return;
        }

        const detail = productionDetails[selectedDetailIndex];

        // Validate quantity against issued quantity
        const issuedQty = detail.IssueQuantity || 0;
        if (qtyKg > issuedQty) {
            setErrorMessage(`Entered quantity (${qtyKg} KG) cannot exceed issued quantity (${issuedQty} KG)`);
            setShowError(true);
            return;
        }

        // Determine Unit based on User Input (Fix for Unit/Qty Mismatch)
        let finalStockUnit = 'KG';
        if (!isReel && qtySheets > 0) {
            finalStockUnit = 'SHEET';
        } else {
            finalStockUnit = 'KG';
        }

        const newItem: ScrapItem = {
            id: Date.now().toString(),
            paperCode: detail.ItemCode,
            quality: detail.Quality,
            size: `${detail.SizeW}x${detail.SizeL}`,
            gsm: detail.GSM,
            mill: detail.Manufecturer,
            finish: detail.Finish,
            balancePieceL: isReel ? 0 : balancePieceL, // Set to 0 if Reel
            balancePieceW: isReel ? 0 : balancePieceW, // Set to 0 if Reel
            qtySheets: isReel ? 0 : qtySheets,         // Set to 0 if Reel
            qtyKg: qtyKg, // Always take the entered/calculated value
            materialSize: `${detail.SizeW}x${detail.SizeL}`,
            status,
            // Additional fields for ItemMaster creation
            itemGroupId: detail.ItemGroupNameID || 0,
            sizeW: detail.SizeW || 0,
            sizeL: detail.SizeL || 0,
            thickness: detail.Thickness || 0,
            density: detail.Density || 0,
            itemSize: `${detail.SizeW}x${detail.SizeL}`,
            // Warehouse and stock fields
            floorWarehouseID: detail.FloorWarehouseID || 0,
            warehouseName: detail.WarehouseName || '',
            stockUnit: finalStockUnit, // Use explicit logic instead of detail.StockUnit
            // Round 2 Mappings
            ProductHSNID: detail.ProductHSNID || 0,
            ItemSubGroupID: detail.ItemSubGroupID || 0,
            WtPerPacking: detail.WtPerPacking || 0,
            EstimationUnit: detail.EstimationUnit || '',
            PurchaseUnit: detail.PurchaseUnit || '',
            PackingType: detail.PackingType || '',
            StockCategory: detail.StockCategory || '',
            EstimationRate: detail.EstimationRate || 0,
            PurchaseRate: detail.PurchaseRate || 0,
            ItemGroupNameID: detail.ItemGroupNameID || 0,
            PaperID: detail.PaperID || 0,
            jobBookingId: selectedContent?.BookingID || 0,
        };

        setScrapItems([...scrapItems, newItem]);

        // Reset form fields but keep job card selected so user can add more from same job
        setBalancePieceW(0);
        setBalancePieceL(0);
        setQtySheets(0);
        setQtyKg(0);
        setSelectedDetailIndex(-1);

        // Show success message briefly
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleRemoveItem = (id: string) => {
        setScrapItems(scrapItems.filter(item => item.id !== id));
    };

    const handleSave = async () => {
        if (scrapItems.length === 0) {
            setErrorMessage('Please add at least one item');
            setShowError(true);
            return;
        }

        try {
            setSaving(true);

            // Get current username for UserID lookup on backend
            // Try multiple sources: standard key, simple key, or inside user data object
            let storedUserName = localStorage.getItem('scrap_user_name');

            if (!storedUserName) {
                storedUserName = localStorage.getItem('Username');
            }

            if (!storedUserName) {
                try {
                    const userDataStr = localStorage.getItem('scrap_user_data');
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        storedUserName = userData.Username || userData.username;
                    }
                } catch (e) {
                    console.error("Error parsing user data", e);
                }
            }

            const userName = storedUserName || '';

            // Call API to save production scrap entries and create ItemMaster records
            const result = await scrapApi.saveProductionScrapEntries(scrapItems, userName);

            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);

                // Reset form
                setScrapItems([]);
                setSelectedContentId(0);
                setProductionDetails([]);
                setBalancePieceW(0);
                setBalancePieceL(0);
                setQtySheets(0);
                setQtyKg(0);
                setSelectedDetailIndex(-1);
            } else {
                setErrorMessage(result.message || 'Failed to save scrap entries');
                setShowError(true);
            }
        } catch (error: any) {
            console.error('Error saving scrap entries:', error);
            console.error('Full error object:', JSON.stringify(error, null, 2));

            // Check if it's an authentication error
            if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('authentication')) {
                // Clear invalid credentials and redirect to login
                localStorage.removeItem('scrap_company_user');
                localStorage.removeItem('scrap_company_pass');
                localStorage.removeItem('scrap_user_name');
                localStorage.removeItem('scrap_user_pass');
                router.push('/login');
            } else {
                // Show detailed error message
                const errorMsg = error.error || error.message || 'Failed to save scrap entry';
                setErrorMessage(errorMsg);
                setShowError(true);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout activePage="entry" headerAction={<ScrapEntryTabs />}>
            <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950">

                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Success Message */}
                    {showSuccess && (
                        <div className="fixed top-20 right-5 z-[100] bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center">
                            <div className="bg-white/20 p-2 rounded-full mr-3">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold">Success!</h4>
                                <p className="text-xs text-green-100 mt-0.5">Scrap entries saved successfully</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {showError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
                            <AlertCircle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-800">Error</h4>
                                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                            </div>
                            <button onClick={() => setShowError(false)} className="text-red-400 hover:text-red-600 ml-4">
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-300 dark:border-slate-800 shadow-sm p-6">
                        {/* Heading and Job Card in same row */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Production Scrap Entry</h3>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium whitespace-nowrap text-slate-700 dark:text-slate-300">Job Card No.</label>
                                <div className="w-64">
                                    <SearchableSelect
                                        options={jobContents.map((jc, index) => {
                                            return {
                                                value: `${jc.JobBookingJobCardContentsID}-${index}`,
                                                label: jc.HasScrap ? `✓ ${jc.JobCardNo}` : jc.JobCardNo
                                            };
                                        })}
                                        value={selectedContentId > 0 ? `${selectedContentId}-${jobContents.findIndex(jc => jc.JobBookingJobCardContentsID === selectedContentId)}` : ''}
                                        onChange={(val) => {
                                            if (!val) return;
                                            const id = Number(val.split('-')[0]);
                                            console.log('Selected Job Card Content ID:', id);
                                            setSelectedContentId(id);
                                        }}
                                        placeholder="Select Job Card"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Production Details Table - Always Visible */}
                        <div className="mb-6 border border-gray-300 dark:border-slate-800 rounded overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">P.Code</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Issued Qty</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Waste Qty</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Quality</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Size L</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Size W</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Cut L</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Cut W</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">GSM</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Mill</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Finish</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Job Name</th>
                                            <th className="p-2 text-left text-xs font-semibold">Sup. Batch No</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={13} className="p-4 text-center text-sm text-gray-500">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                        <span>Loading production details...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : productionDetails.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="p-4 text-center text-sm text-gray-500">
                                                    {selectedContentId > 0
                                                        ? 'No production data available for this job card. This job card may not have been used in production yet.'
                                                        : 'Select a Job Card No. to view production details'}
                                                </td>
                                            </tr>
                                        ) : (
                                            productionDetails.map((detail, index) => (
                                                <tr
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedDetailIndex(index);
                                                        // Auto-calculate Balance Piece L and W as: Balance = Size - CutSize
                                                        // Round to 4 decimal places to avoid floating-point precision errors
                                                        const balanceL = parseFloat(((detail.SizeL || 0) - (detail.CutSizeL || 0)).toFixed(4));
                                                        const balanceW = parseFloat(((detail.SizeW || 0) - (detail.CutSizeW || 0)).toFixed(4));
                                                        setBalancePieceL(balanceL);
                                                        setBalancePieceW(balanceW);

                                                        // Auto-fill Quantity based on Stock Unit
                                                        const wasteQty = detail.IssueQuantity || 0;
                                                        if (detail.StockUnit?.toUpperCase() === 'SHEET' || detail.StockUnit?.toUpperCase() === 'SHEETS') {
                                                            setQtySheets(wasteQty);
                                                            setQtyKg(0); // Let auto-calc handle KG if logic exists, or 0 if manual
                                                        } else {
                                                            setQtyKg(wasteQty);
                                                            setQtySheets(0);
                                                        }
                                                    }}
                                                    className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 ${selectedDetailIndex === index ? 'bg-blue-100' : ''
                                                        }`}
                                                >
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">{detail.ItemCode}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.IssueQuantity}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.RemainingPaper}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.Quality}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.SizeL}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.SizeW}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.CutSizeL || '-'}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.CutSizeW || '-'}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.GSM}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.Manufecturer}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{detail.Finish}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800"></td>
                                                    <td className="p-2 text-sm">{detail.SupplierBatchNo}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Form Inputs with Add and Remove Buttons - Responsive Layout */}
                        <div className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Balance Piece L</label>
                                    <input
                                        type="number"
                                        value={balancePieceL || ''}
                                        onChange={(e) => setBalancePieceL(Number(e.target.value))}
                                        disabled={isReel}
                                        className={`w-full p-2 border border-gray-300 dark:border-slate-700 rounded ${isReel ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-400' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Balance Piece W</label>
                                    <input
                                        type="number"
                                        value={balancePieceW || ''}
                                        onChange={(e) => setBalancePieceW(Number(e.target.value))}
                                        disabled={isReel}
                                        className={`w-full p-2 border border-gray-300 dark:border-slate-700 rounded ${isReel ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-400' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Qty(Sheets)</label>
                                    <input
                                        type="number"
                                        value={qtySheets || ''}
                                        onChange={(e) => setQtySheets(Number(e.target.value))}
                                        disabled={isReel}
                                        className={`w-full p-2 border border-gray-300 dark:border-slate-700 rounded ${isReel ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-400' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Qty(Kg) {isReel ? '' : <span className="text-xs text-gray-500">(Auto)</span>}</label>
                                    <input
                                        type="number"
                                        value={qtyKg || ''}
                                        onChange={(e) => {
                                            const newQty = Number(e.target.value);
                                            // Check against issued quantity if available
                                            if (selectedDetailIndex >= 0 && productionDetails[selectedDetailIndex]) {
                                                const issuedQty = productionDetails[selectedDetailIndex].IssueQuantity || 0;
                                                if (newQty > issuedQty) {
                                                    setErrorMessage(`Quantity cannot exceed issued quantity (${issuedQty} KG)`);
                                                    setShowError(true);
                                                    setTimeout(() => setShowError(false), 3000);
                                                    return;
                                                }
                                            }
                                            if (isReel) setQtyKg(newQty);
                                        }}
                                        readOnly={!isReel}
                                        className={`w-full p-2 border border-gray-300 dark:border-slate-700 rounded ${!isReel ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed text-gray-400' : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'}`}
                                        placeholder="0"
                                    />
                                </div>
                                <div>

                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as 'Stock' | 'Scrap')}
                                        className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                                    >
                                        <option value="Scrap">Scrap</option>
                                        <option value="Stock">Stock</option>
                                    </select>
                                </div>
                                {/* Buttons moved to the same row */}
                                <button
                                    onClick={handleAddItem}
                                    className="h-[42px] px-4 py-2 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus size={18} />
                                    Add
                                </button>
                                <button
                                    onClick={() => scrapItems.length > 0 && handleRemoveItem(scrapItems[scrapItems.length - 1].id)}
                                    className="h-[42px] px-4 py-2 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border-2 border-red-600 dark:border-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-400 dark:disabled:text-slate-600 disabled:border-gray-300 dark:disabled:border-slate-700 transition-colors"
                                    disabled={scrapItems.length === 0}
                                >
                                    <Trash2 size={18} />
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Added Items Table - Always Visible */}
                        <div className="border border-gray-300 dark:border-slate-800 rounded overflow-hidden mb-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">P.Code</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Quality</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Size</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">GSM</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Mill</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Finish</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Balance Piece L</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Balance Piece W</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Qty(Sheets)</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Qty(Kg)</th>
                                            <th className="p-2 text-left text-xs font-semibold border-r border-gray-300 dark:border-slate-800">Material Size</th>
                                            <th className="p-2 text-left text-xs font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                                        {scrapItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={12} className="p-4 text-center text-sm text-gray-500">
                                                    No items added yet
                                                </td>
                                            </tr>
                                        ) : (
                                            scrapItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">{item.paperCode}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.quality}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.size}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.gsm}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.mill}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.finish}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.balancePieceL}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.balancePieceW}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.qtySheets}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.qtyKg}</td>
                                                    <td className="p-2 text-sm border-r border-gray-300 dark:border-slate-800">{item.materialSize}</td>
                                                    <td className="p-2 text-sm">{item.status}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || scrapItems.length === 0}
                                className="px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div >
            </div >
        </Layout >
    );
};