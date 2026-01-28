'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Edit, Printer, Search, Calendar, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { Layout } from '@/components/Layout';

interface Invoice {
  InvoiceTransactionID: number;
  VoucherNo: string;
  VoucherDate: string;
  ClientName: string;
  NetAmount: number;
  TotalQuantity: number;
  ItemsCount: number;
  CreatedBy: string;
  CreatedDate: string;
  Status: string;
  ItemNames?: string;
  StockUnit?: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  align: 'left' | 'center' | 'right';
}

export const ShowProcessed: React.FC = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate]);

  // Column resizing state
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'VoucherNo', label: 'Invoice No', width: 120, minWidth: 100, align: 'left' },
    { key: 'VoucherDate', label: 'Date', width: 100, minWidth: 100, align: 'left' },
    { key: 'ClientName', label: 'Client Name', width: 200, minWidth: 150, align: 'left' },
    { key: 'ItemNames', label: 'Item Name', width: 150, minWidth: 120, align: 'left' },
    { key: 'NetAmount', label: 'Net Amount', width: 110, minWidth: 100, align: 'right' },
    { key: 'ItemsCount', label: 'Items', width: 70, minWidth: 60, align: 'center' },
    { key: 'TotalQuantity', label: 'Qty', width: 80, minWidth: 60, align: 'right' },
    { key: 'CreatedBy', label: 'Created By', width: 100, minWidth: 80, align: 'left' },
    { key: 'CreatedDate', label: 'Created At', width: 140, minWidth: 140, align: 'left' },
    { key: 'Status', label: 'Status', width: 90, minWidth: 80, align: 'center' },
    { key: 'Actions', label: 'Actions', width: 100, minWidth: 100, align: 'center' },
  ]);

  const tableRef = useRef<HTMLTableElement>(null);
  const resizingColumn = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, fromDate, toDate, invoices]);

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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const { scrapApi } = await import('@/lib/api');
      const result = await scrapApi.getAllInvoices();

      if (result.success && result.data) {
        setInvoices(result.data as Invoice[]);
        setFilteredInvoices(result.data as Invoice[]);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Error loading invoices');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Global search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.VoucherNo.toLowerCase().includes(term) ||
          inv.ClientName.toLowerCase().includes(term) ||
          inv.CreatedBy.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter((inv) => inv.VoucherDate >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((inv) => inv.VoucherDate <= toDate);
    }

    setFilteredInvoices(filtered);
  };

  const handleEdit = (invoiceId: number) => {
    // Navigate to Scrap Invoice page with query param id
    router.push(`/scrap/sales/invoice?id=${invoiceId}`);
  };

  const handlePrint = async (invoiceId: number) => {
    try {
      const { scrapApi } = await import('@/lib/api');
      const result = await scrapApi.getInvoiceById(invoiceId);

      if (result.success && result.data) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(generatePrintHTML(result.data));
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        console.error('Print API returned error:', result);
        alert('Failed to load invoice for printing: ' + (result.message || 'Unknown error') + (result.error ? ` (${result.error})` : ''));
      }
    } catch (err: any) {
      console.error('Error fetching invoice for print:', err);
      alert('Failed to load invoice for printing: ' + (err.message || 'Network error'));
    }
  };

  // Helper function to convert number to words (Indian format)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
  };

  const generatePrintHTML = (invoiceData: any) => {
    const { MainData, Items } = invoiceData;
    const amountInWords = numberToWords(Math.floor(MainData.NetAmount || 0));

    const itemsHTML = Items.map((item: any, index: number) => `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${index + 1}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${item.ItemName || ''}<br/><span style="font-size: 9px;">(${item.ItemCode || ''})</span></td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.HSNCode || 'N/A'}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatNumber(item.Quantity)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.RateType || ''}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatNumber(item.Rate)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatNumber(item.BasicAmount)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatNumber(item.TaxableAmount || item.BasicAmount)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px;">${item.IGSTPercent || '0'}%</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px;">${formatNumber(item.IGSTAmount || 0)}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-size: 10px; font-weight: bold;">${formatNumber(item.NetAmount)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice ${MainData.VoucherNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px;
            padding: 15px;
            background: white;
          }
          .invoice-container {
            border: 2px solid #000;
            padding: 0;
          }
          .header {
            text-align: center;
            padding: 8px;
            border-bottom: 2px solid #000;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 4px;
          }
          .header .subtitle {
            font-size: 10px;
            font-style: italic;
          }
          .top-info {
            display: flex;
            justify-content: space-between;
            padding: 6px 10px;
            border-bottom: 1px solid #000;
            font-size: 10px;
          }
          .details-section {
            display: flex;
            border-bottom: 2px solid #000;
          }
          .details-box {
            flex: 1;
            padding: 8px;
            border-right: 1px solid #000;
          }
          .details-box:last-child {
            border-right: none;
          }
          .details-box h3 {
            font-size: 11px;
            margin-bottom: 6px;
            text-decoration: underline;
          }
          .details-box p {
            font-size: 10px;
            margin: 2px 0;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 6px 4px;
            font-size: 10px;
            font-weight: bold;
            text-align: center;
          }
          .amount-words {
            border: 1px solid #000;
            border-top: none;
            padding: 8px;
            font-size: 10px;
          }
          .totals-section {
            display: flex;
            border-top: 2px solid #000;
          }
          .tax-details {
            flex: 1;
            border-right: 1px solid #000;
            padding: 8px;
          }
          .tax-details table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .tax-details th, .tax-details td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
          }
          .grand-total {
            flex: 1;
            padding: 8px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
          .grand-total table {
            width: 100%;
            font-size: 11px;
          }
          .grand-total td {
            padding: 4px;
            text-align: right;
          }
          .grand-total .total-row {
            font-weight: bold;
            font-size: 13px;
            border-top: 2px solid #000;
          }
          .terms {
            border-top: 1px solid #000;
            padding: 8px;
            font-size: 9px;
          }
          .terms h4 {
            font-size: 10px;
            margin-bottom: 4px;
          }
          .terms ol {
            margin-left: 20px;
          }
          .terms li {
            margin: 2px 0;
          }
          .signature {
            text-align: right;
            padding: 30px 20px 10px;
            font-size: 10px;
          }
          .signature-line {
            border-top: 1px solid #000;
            display: inline-block;
            width: 200px;
            margin-top: 40px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            padding: 6px;
            border-top: 1px solid #000;
            font-style: italic;
          }
          @media print {
            body { padding: 0; }
            .invoice-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <h1>TAX INVOICE</h1>
            <div class="subtitle">Original for Recipient</div>
          </div>

          <!-- Top Info -->
          <div class="top-info">
            <div>${new Date(MainData.VoucherDate).toLocaleDateString('en-GB')}</div>
            <div>Invoice: <strong>${MainData.VoucherNo}</strong></div>
          </div>

          <!-- Details Section -->
          <div class="details-section">
            <!-- Receiver Details -->
            <div class="details-box">
              <h3>Details of Receiver (Billed To)</h3>
              <p><strong>Name:</strong> ${MainData.ClientName || ''}</p>
              <p><strong>Address:</strong> ${MainData.ClientAddress || ''}</p>
              <p><strong>State:</strong> ${MainData.ClientState || ''}</p>
            </div>

            <!-- Consignee Details -->
            <div class="details-box">
              <h3>Details of Consignee (Shipped To)</h3>
              <p><strong>Name:</strong> ${MainData.ClientName || ''}</p>
              <p><strong>Address:</strong> ${MainData.ClientAddress || ''}</p>
              <p><strong>Place:</strong> ${MainData.ClientCity || ''}</p>
            </div>

            <!-- Invoice Details -->
            <div class="details-box">
              <h3>Invoice Details</h3>
              <p><strong>Invoice No:</strong> ${MainData.VoucherNo}</p>
              <p><strong>Date:</strong> ${new Date(MainData.VoucherDate).toLocaleDateString('en-GB')}</p>
              ${MainData.VehicleNo ? `<p><strong>Vehicle No:</strong> ${MainData.VehicleNo}</p>` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px;">S.N.</th>
                <th>Description of<br/>Goods</th>
                <th style="width: 60px;">HSN/SAC</th>
                <th style="width: 50px;">Qty</th>
                <th style="width: 40px;">Unit</th>
                <th style="width: 60px;">Rate</th>
                <th style="width: 70px;">Amount</th>
                <th style="width: 70px;">Taxable</th>
                <th style="width: 50px;">IGST%</th>
                <th style="width: 60px;">Tax Amt</th>
                <th style="width: 70px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              <tr>
                <td colspan="6" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10px;">Total:</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10px;">${formatNumber(MainData.TotalBasicAmount)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10px;">${formatNumber(MainData.TotalBasicAmount)}</td>
                <td style="border: 1px solid #000; padding: 4px; font-size: 10px;"></td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10px;">${formatNumber(MainData.TotalTaxAmount)}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; font-size: 10px;">${formatNumber(MainData.NetAmount)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Amount in Words -->
          <div class="amount-words">
            <strong>Amount in Words:</strong> ${amountInWords} Rupees Only
          </div>

          <!-- Totals Section -->
          <div class="totals-section">
            <!-- Tax Details -->
            <div class="tax-details">
              <h4 style="margin-bottom: 6px;">Tax Details:</h4>
              <table>
                <thead>
                  <tr>
                    <th>Tax Ledger</th>
                    <th>Taxable</th>
                    <th>Tax Rate</th>
                    <th>Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${MainData.TotalIGSTTaxAmount > 0 ? `
                  <tr>
                    <td>IGST</td>
                    <td>${formatNumber(MainData.TotalBasicAmount)}</td>
                    <td>18%</td>
                    <td>${formatNumber(MainData.TotalIGSTTaxAmount)}</td>
                  </tr>
                  ` : ''}
                  ${MainData.TotalCGSTTaxAmount > 0 ? `
                  <tr>
                    <td>CGST</td>
                    <td>${formatNumber(MainData.TotalBasicAmount / 2)}</td>
                    <td>9%</td>
                    <td>${formatNumber(MainData.TotalCGSTTaxAmount)}</td>
                  </tr>
                  ` : ''}
                  ${MainData.TotalSGSTTaxAmount > 0 ? `
                  <tr>
                    <td>SGST</td>
                    <td>${formatNumber(MainData.TotalBasicAmount / 2)}</td>
                    <td>9%</td>
                    <td>${formatNumber(MainData.TotalSGSTTaxAmount)}</td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>

            <!-- Grand Total -->
            <div class="grand-total">
              <table>
                <tr>
                  <td>Total Basic:</td>
                  <td>${formatNumber(MainData.TotalBasicAmount)}</td>
                </tr>
                <tr>
                  <td>Total Taxable:</td>
                  <td>${formatNumber(MainData.TotalBasicAmount)}</td>
                </tr>
                <tr>
                  <td>Total Tax:</td>
                  <td>${formatNumber(MainData.TotalTaxAmount)}</td>
                </tr>
                <tr>
                  <td>Round Off:</td>
                  <td>0.00</td>
                </tr>
                <tr class="total-row">
                  <td>Grand Total:</td>
                  <td>₹ ${formatNumber(MainData.NetAmount)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Terms & Conditions -->
          <div class="terms">
            <h4>Terms & Conditions:</h4>
            <ol>
              <li>Goods once sold will not be taken back or exchanged.</li>
              <li>Interest @ 18% p.a will be charged if payment is not made within 7 days.</li>
            </ol>
          </div>

          <!-- Signature -->
          <div class="signature">
            <div class="signature-line"></div>
            <div style="margin-top: 4px;">Authorized Signatory</div>
            <div style="font-size: 9px; font-style: italic; margin-top: 2px;">(Signature & Seal)</div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <strong>about blank</strong> | Page 1/1
          </div>
        </div>
      </body>
      </html>
    `;
  };


  const clearFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');

      // Prepare data for export
      const exportData = filteredInvoices.map((invoice, index) => ({
        'Sr No': index + 1,
        'Invoice No': invoice.VoucherNo,
        'Date': new Date(invoice.VoucherDate).toLocaleDateString(),
        'Client Name': invoice.ClientName,
        'Item Names': invoice.ItemNames || '-',
        'Net Amount (₹)': invoice.NetAmount,
        'Items Count': invoice.ItemsCount,
        'Total Quantity': invoice.TotalQuantity,
        'Unit': invoice.StockUnit || '',
        'Created By': invoice.CreatedBy,
        'Created Date': new Date(invoice.CreatedDate).toLocaleString(),
        'Status': invoice.Status
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },  // Sr No
        { wch: 15 }, // Invoice No
        { wch: 12 }, // Date
        { wch: 25 }, // Client Name
        { wch: 30 }, // Item Names
        { wch: 15 }, // Net Amount
        { wch: 12 }, // Items Count
        { wch: 15 }, // Total Quantity
        { wch: 8 },  // Unit
        { wch: 15 }, // Created By
        { wch: 20 }, // Created Date
        { wch: 10 }  // Status
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `Scrap_Invoices_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel');
    }
  };

  const renderCellValue = (invoice: Invoice, columnKey: string) => {
    switch (columnKey) {
      case 'VoucherNo':
        return <span className="font-medium text-slate-800 dark:text-slate-200">{invoice.VoucherNo}</span>;
      case 'VoucherDate':
        return <span className="text-slate-600 dark:text-slate-300">{new Date(invoice.VoucherDate).toLocaleDateString()}</span>;
      case 'ClientName':
        return <span className="text-slate-700 dark:text-slate-200 font-medium">{invoice.ClientName}</span>;
      case 'ItemNames':
        return <span className="text-slate-600 dark:text-slate-300 text-xs">{invoice.ItemNames || '-'}</span>;
      case 'NetAmount':
        return <span className="font-semibold text-slate-800 dark:text-slate-200">₹{formatNumber(invoice.NetAmount)}</span>;
      case 'ItemsCount':
        return <span className="text-slate-600 dark:text-slate-300">{invoice.ItemsCount}</span>;
      case 'TotalQuantity':
        return <span className="text-slate-600 dark:text-slate-300">{formatNumber(invoice.TotalQuantity)} <span className="text-xs text-slate-400">{invoice.StockUnit || ''}</span></span>;
      case 'CreatedBy':
        return <span className="text-slate-600 dark:text-slate-300">{invoice.CreatedBy}</span>;
      case 'CreatedDate':
        return <span className="text-slate-600 dark:text-slate-300">{new Date(invoice.CreatedDate).toLocaleString()}</span>;
      case 'Status':
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${invoice.Status === 'Active'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
              }`}
          >
            {invoice.Status}
          </span>
        );
      case 'Actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => handleEdit(invoice.InvoiceTransactionID)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Invoice"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handlePrint(invoice.InvoiceTransactionID)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Print Invoice"
            >
              <Printer size={16} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Invoices</p>
          <p>{error}</p>
          <button
            onClick={fetchInvoices}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate total table width
  const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Layout activePage="processed">
      <div className="h-full flex flex-col p-4 md:p-6 w-full space-y-4 bg-gray-50 dark:bg-slate-950 overflow-x-hidden">

        {/* Filters */}
        <div className="flex-none bg-white dark:bg-slate-900 p-3 md:p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">
                Search (Invoice No, Client, Created By)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-slate-100"
                />
              </div>
            </div>

            {/* From Date */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-slate-100"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-slate-100"
                />
              </div>
            </div>

            {/* Export to Excel Button */}
            <div className="flex items-end">
              <button
                onClick={exportToExcel}
                disabled={filteredInvoices.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                title="Export to Excel"
              >
                <Download size={18} />
                <span className="hidden lg:inline">Export to Excel</span>
                <span className="lg:hidden">Export</span>
              </button>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || fromDate || toDate) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Table Container - Flex 1 to take remaining height */}
        <div className="flex-1 min-h-0 min-w-0 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileText size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-medium">No scrap invoices found</p>
              <p className="text-sm">Try adjusting your filters or create a new invoice</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden flex-1 overflow-auto p-3 space-y-3">
                {paginatedInvoices.map((invoice) => (
                  <div
                    key={invoice.InvoiceTransactionID}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{invoice.VoucherNo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(invoice.VoucherDate).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${invoice.Status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {invoice.Status}
                      </span>
                    </div>

                    {/* Client Name */}
                    <p className="font-medium text-slate-700 dark:text-slate-200 mb-2 truncate">{invoice.ClientName}</p>

                    {/* Item Name */}
                    {invoice.ItemNames && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">{invoice.ItemNames}</p>
                    )}

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mb-3 py-2 border-t border-b border-slate-100 dark:border-slate-700">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{formatNumber(invoice.NetAmount)}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Amount</p>
                      </div>
                      <div className="text-center border-l border-r border-slate-100 dark:border-slate-700">
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{invoice.ItemsCount}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatNumber(invoice.TotalQuantity)}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{invoice.StockUnit || 'Qty'}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span>By {invoice.CreatedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(invoice.InvoiceTransactionID)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handlePrint(invoice.InvoiceTransactionID)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                <table
                  ref={tableRef}
                  className="border-collapse min-w-full"
                  style={{ width: `${Math.max(totalTableWidth, 0)}px`, tableLayout: 'fixed' }}
                >
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 shadow-sm">
                      {columns.map((column, index) => (
                        <th
                          key={column.key}
                          className="relative p-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                          style={{
                            width: `${column.width}px`,
                            minWidth: `${column.minWidth}px`,
                            maxWidth: `${column.width}px`,
                            textAlign: column.align,
                          }}
                        >
                          <div className="truncate pr-2">{column.label}</div>
                          {/* Resize handle */}
                          {index < columns.length - 1 && (
                            <div
                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors"
                              onMouseDown={(e) => handleMouseDown(e, index)}
                              style={{ marginRight: '-2px' }}
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInvoices.map((invoice, rowIndex) => (
                      <tr
                        key={invoice.InvoiceTransactionID}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors ${rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/30'
                          }`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className="p-3 text-sm border-r border-slate-100 dark:border-slate-800 last:border-r-0 overflow-hidden text-slate-700 dark:text-slate-200"
                            style={{
                              width: `${column.width}px`,
                              minWidth: `${column.minWidth}px`,
                              maxWidth: `${column.width}px`,
                              textAlign: column.align,
                            }}
                          >
                            <div className="truncate">
                              {renderCellValue(invoice, column.key)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination Controls - Fixed at bottom */}
        <div className="flex-none bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mb-16 md:mb-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            {/* Desktop: Show resize hint, Mobile: Show count */}
            <div className="text-xs text-slate-500 ml-2">
              <span className="hidden md:inline">Drag column borders to resize.</span>
              <span className="md:hidden">
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredInvoices.length > 0 && (
              <div className="flex items-center gap-3 sm:gap-4 mr-2">
                {/* Rows per page - hide on small mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-slate-500">Rows:</span>
                  <input
                    type="number"
                    min="1"
                    value={itemsPerPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0) setItemsPerPage(val);
                    }}
                    className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-800 rounded text-sm text-center bg-transparent dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 sm:p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    &lt;
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[80px] text-center">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 sm:p-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout >
  );
};
