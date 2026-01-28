'use client';

import React from 'react';
import { formatNumber } from '@/lib/utils';

interface InvoicePrintProps {
  invoiceData: {
    invoiceNo: string;
    invoiceDate: string;
    voucherType: string;
    client: {
      name: string;
      address: string;
      city: string;
      state: string;
      pinCode: string;
      gstin: string;
      phone: string;
      email: string;
    };
    consignee?: {
      name: string;
      address: string;
      city: string;
      state: string;
      pinCode: string;
      gstin: string;
    };
    transport?: {
      transporterName: string;
      vehicleNo: string;
      ewayBillNo: string;
      destination: string;
      freight: string;
    };
    items: Array<{
      srNo: number;
      productCode: string;
      description: string;
      quantity: number;
      unit: string;
      wtPerPacking?: number; // Weight per piece for PCS items
      originalStockUnit?: string; // Original stock unit
      rate: number;
      amount: number;
      discountAmount: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      netAmount: number;
    }>;
    charges: Array<{
      ledgerName: string;
      taxPercentage: number;
      amount: number;
    }>;
    totals: {
      totalQuantity: number;
      totalBasicAmount: number;
      totalDiscountAmount: number;
      totalTaxableAmount: number;
      totalCGSTAmount: number;
      totalSGSTAmount: number;
      totalIGSTAmount: number;
      totalCharges: number;
      roundOff: number;
      netAmount: number;
    };
    narration?: string;
  };
  companyInfo?: {
    name: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    gstin: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({ invoiceData, companyInfo }) => {
  return (
    <div className="print-invoice bg-white p-8 max-w-[210mm] mx-auto">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print-invoice {
            max-width: 100%;
            margin: 0;
            padding: 10mm;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 border-b-2 border-black p-4">
          <div className="flex justify-between items-start">
            <div>
              {companyInfo?.logo && (
                <img src={companyInfo.logo} alt="Company Logo" className="h-16 mb-2" />
              )}
              <h1 className="text-2xl font-bold">{companyInfo?.name || 'Your Company Name'}</h1>
              <p className="text-sm mt-1">
                {companyInfo?.address || 'Company Address'}<br />
                {companyInfo?.city}, {companyInfo?.state} - {companyInfo?.pinCode}<br />
                <strong>GSTIN:</strong> {companyInfo?.gstin}<br />
                <strong>Phone:</strong> {companyInfo?.phone} | <strong>Email:</strong> {companyInfo?.email}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold border-2 border-black px-4 py-2 inline-block">
                TAX INVOICE
              </h2>
              <p className="text-sm mt-2">
                <strong>Invoice No:</strong> {invoiceData.invoiceNo}<br />
                <strong>Date:</strong> {new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Party Details */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          {/* Bill To */}
          <div className="p-4 border-r-2 border-black">
            <h3 className="font-bold text-sm mb-2 underline">BILL TO:</h3>
            <p className="text-sm">
              <strong className="text-base">{invoiceData.client.name}</strong><br />
              {invoiceData.client.address}<br />
              {invoiceData.client.city}, {invoiceData.client.state} - {invoiceData.client.pinCode}<br />
              {invoiceData.client.gstin && (
                <><strong>GSTIN:</strong> {invoiceData.client.gstin}<br /></>
              )}
              {invoiceData.client.phone && (
                <><strong>Phone:</strong> {invoiceData.client.phone}<br /></>
              )}
            </p>
          </div>

          {/* Ship To */}
          <div className="p-4">
            <h3 className="font-bold text-sm mb-2 underline">SHIP TO:</h3>
            {invoiceData.consignee ? (
              <p className="text-sm">
                <strong className="text-base">{invoiceData.consignee.name}</strong><br />
                {invoiceData.consignee.address}<br />
                {invoiceData.consignee.city}, {invoiceData.consignee.state} - {invoiceData.consignee.pinCode}<br />
                {invoiceData.consignee.gstin && (
                  <><strong>GSTIN:</strong> {invoiceData.consignee.gstin}</>
                )}
              </p>
            ) : (
              <p className="text-sm italic">Same as Bill To</p>
            )}
          </div>
        </div>

        {/* Transport Details */}
        {invoiceData.transport && (
          <div className="p-4 border-b-2 border-black">
            <h3 className="font-bold text-sm mb-2">TRANSPORT DETAILS:</h3>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div>
                <strong>Transporter:</strong> {invoiceData.transport.transporterName || 'N/A'}
              </div>
              <div>
                <strong>Vehicle No:</strong> {invoiceData.transport.vehicleNo || 'N/A'}
              </div>
              <div>
                <strong>E-Way Bill:</strong> {invoiceData.transport.ewayBillNo || 'N/A'}
              </div>
              <div>
                <strong>Destination:</strong> {invoiceData.transport.destination || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full border-2 border-black mb-4 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-center" style={{ width: '30px' }}>SR</th>
            <th className="border border-black p-2 text-left" style={{ width: '80px' }}>CODE</th>
            <th className="border border-black p-2 text-left">DESCRIPTION</th>
            <th className="border border-black p-2 text-center" style={{ width: '60px' }}>QTY</th>
            <th className="border border-black p-2 text-center" style={{ width: '40px' }}>UNIT</th>
            <th className="border border-black p-2 text-right" style={{ width: '80px' }}>RATE</th>
            <th className="border border-black p-2 text-right" style={{ width: '80px' }}>AMOUNT</th>
            <th className="border border-black p-2 text-right" style={{ width: '60px' }}>DISC</th>
            <th className="border border-black p-2 text-right" style={{ width: '80px' }}>TAXABLE</th>
            <th className="border border-black p-2 text-right" style={{ width: '60px' }}>CGST</th>
            <th className="border border-black p-2 text-right" style={{ width: '60px' }}>SGST</th>
            <th className="border border-black p-2 text-right" style={{ width: '80px' }}>NET AMT</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items.map((item, index) => (
            <tr key={index}>
              <td className="border border-black p-2 text-center">{item.srNo}</td>
              <td className="border border-black p-2">{item.productCode}</td>
              <td className="border border-black p-2">{item.description}</td>
              <td className="border border-black p-2 text-center">
                {formatNumber(item.quantity)}
                {/* Show dual unit for PCS items */}
                {item.originalStockUnit?.toUpperCase() === 'PCS' && item.wtPerPacking && (
                  <div className="text-[9px] text-gray-600">
                    {item.unit === 'KG'
                      ? `(${formatNumber(item.quantity / item.wtPerPacking)} PCS)`
                      : `(${formatNumber(item.quantity * item.wtPerPacking)} KG)`
                    }
                  </div>
                )}
              </td>
              <td className="border border-black p-2 text-center">{item.unit}</td>
              <td className="border border-black p-2 text-right">{formatNumber(item.rate)}</td>
              <td className="border border-black p-2 text-right">{formatNumber(item.amount)}</td>
              <td className="border border-black p-2 text-right">{formatNumber(item.discountAmount)}</td>
              <td className="border border-black p-2 text-right">{formatNumber(item.taxableAmount)}</td>
              <td className="border border-black p-2 text-right">{formatNumber(item.cgstAmount)}</td>
              <td className="border border-black p-2 text-right">{formatNumber(item.sgstAmount)}</td>
              <td className="border border-black p-2 text-right font-bold">{formatNumber(item.netAmount)}</td>
            </tr>
          ))}

          {/* Additional Charges */}
          {invoiceData.charges.map((charge, index) => (
            <tr key={`charge-${index}`}>
              <td className="border border-black p-2 text-center"></td>
              <td className="border border-black p-2" colSpan={7}>
                <strong>{charge.ledgerName}</strong> @ {charge.taxPercentage}%
              </td>
              <td className="border border-black p-2 text-right" colSpan={4}>
                <strong>{formatNumber(charge.amount)}</strong>
              </td>
            </tr>
          ))}

          {/* Totals Row */}
          <tr className="bg-gray-100 font-bold">
            <td className="border border-black p-2 text-center" colSpan={3}>TOTAL</td>
            <td className="border border-black p-2 text-center">{formatNumber(invoiceData.totals.totalQuantity)}</td>
            <td className="border border-black p-2"></td>
            <td className="border border-black p-2"></td>
            <td className="border border-black p-2 text-right">{formatNumber(invoiceData.totals.totalBasicAmount)}</td>
            <td className="border border-black p-2 text-right">{formatNumber(invoiceData.totals.totalDiscountAmount)}</td>
            <td className="border border-black p-2 text-right">{formatNumber(invoiceData.totals.totalTaxableAmount)}</td>
            <td className="border border-black p-2 text-right">{formatNumber(invoiceData.totals.totalCGSTAmount)}</td>
            <td className="border border-black p-2 text-right">{formatNumber(invoiceData.totals.totalSGSTAmount)}</td>
            <td className="border border-black p-2 text-right">{formatNumber(invoiceData.totals.netAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words & Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border-2 border-black p-4">
          <h3 className="font-bold text-sm mb-2">AMOUNT IN WORDS:</h3>
          <p className="text-sm font-semibold">{convertNumberToWords(invoiceData.totals.netAmount)} Only</p>

          {invoiceData.narration && (
            <>
              <h3 className="font-bold text-sm mt-4 mb-2">NARRATION:</h3>
              <p className="text-xs">{invoiceData.narration}</p>
            </>
          )}
        </div>

        <div className="border-2 border-black p-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Taxable Amount:</span>
            <span className="font-semibold">₹ {formatNumber(invoiceData.totals.totalTaxableAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>CGST:</span>
            <span className="font-semibold">₹ {formatNumber(invoiceData.totals.totalCGSTAmount)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>SGST:</span>
            <span className="font-semibold">₹ {formatNumber(invoiceData.totals.totalSGSTAmount)}</span>
          </div>
          {invoiceData.totals.totalIGSTAmount > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>IGST:</span>
              <span className="font-semibold">₹ {formatNumber(invoiceData.totals.totalIGSTAmount)}</span>
            </div>
          )}
          {invoiceData.totals.totalCharges > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>Additional Charges:</span>
              <span className="font-semibold">₹ {formatNumber(invoiceData.totals.totalCharges)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-1">
            <span>Round Off:</span>
            <span className="font-semibold">₹ {formatNumber(invoiceData.totals.roundOff)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t-2 border-black pt-2 mt-2">
            <span>GRAND TOTAL:</span>
            <span>₹ {formatNumber(invoiceData.totals.netAmount)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Signature */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-2 border-black p-4">
          <h3 className="font-bold text-sm mb-2">TERMS & CONDITIONS:</h3>
          <ol className="text-xs list-decimal list-inside space-y-1">
            <li>Goods once sold will not be taken back</li>
            <li>Interest @ 18% p.a. will be charged if payment not received within due date</li>
            <li>Subject to local jurisdiction only</li>
          </ol>
        </div>

        <div className="border-2 border-black p-4">
          <h3 className="font-bold text-sm mb-2">FOR {companyInfo?.name?.toUpperCase() || 'COMPANY NAME'}</h3>
          <div className="mt-16 pt-4 border-t border-black">
            <p className="text-sm font-semibold text-center">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 text-xs text-gray-600">
        <p>This is a computer generated invoice and does not require signature</p>
      </div>
    </div>
  );
};

// Helper function to convert numbers to words (Indian format)
function convertNumberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (amount === 0) return 'Zero Rupees';

  const crores = Math.floor(amount / 10000000);
  amount %= 10000000;
  const lakhs = Math.floor(amount / 100000);
  amount %= 100000;
  const thousands = Math.floor(amount / 1000);
  amount %= 1000;
  const hundreds = Math.floor(amount / 100);
  amount %= 100;
  const tensPlace = Math.floor(amount / 10);
  const onesPlace = amount % 10;

  let words = '';

  if (crores > 0) words += convertTwoDigit(crores) + ' Crore ';
  if (lakhs > 0) words += convertTwoDigit(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertTwoDigit(thousands) + ' Thousand ';
  if (hundreds > 0) words += ones[hundreds] + ' Hundred ';

  if (tensPlace === 1) {
    words += teens[onesPlace] + ' ';
  } else {
    if (tensPlace > 0) words += tens[tensPlace] + ' ';
    if (onesPlace > 0) words += ones[onesPlace] + ' ';
  }

  return words.trim() + ' Rupees';

  function convertTwoDigit(num: number): string {
    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    const t = Math.floor(num / 10);
    const o = num % 10;
    return tens[t] + (o > 0 ? ' ' + ones[o] : '');
  }
}