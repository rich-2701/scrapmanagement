// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   FileText, Plus, Trash2, Save, Send, Printer, Calendar,
//   Package, Users, Truck, MapPin, Calculator, CheckCircle2,
//   X, AlertCircle, Download, Eye
// } from 'lucide-react';
// import { formatNumber } from '@/lib/utils';
// import { invoiceApi } from '@/lib/api';
// import { Skeleton } from '@/components/Skeleton';
// import { SearchableSelect } from '@/components/ui/SearchableSelect';

// // ===== TYPE DEFINITIONS =====

// interface VoucherType {
//   voucherID: number;
//   voucherName: string;
//   prefix: string;
//   isGstApplicable: boolean;
// }

// interface Client {
//   ledgerID: number;
//   ledgerName: string;
//   mailingName: string;
//   state: string;
//   country: string;
//   companyStateTinNo: number;
//   gstApplicable: boolean;
//   creditDays?: number;
//   Address1?: string;
//   City?: string;
//   State?: string;
//   PinCode?: string;
//   GSTIN?: string;
//   Phone?: string;
//   Email?: string;
// }

// interface Consignee {
//   consigneeID: number;
//   consigneeName: string;
//   mailingName: string;
//   state: string;
//   city: string;
//   companyStateTinNo: number;
//   gstApplicable: boolean;
//   Address?: string;
//   Destination?: string;
//   State?: string;
//   PinCode?: string;
//   GSTIN?: string;
// }

// interface ProductHSN {
//   productHSNID: number;
//   productHSNName: string;
//   hsnCode: string;
//   gstTaxPercentage: number;
//   cgstTaxPercentage: number;
//   sgstTaxPercentage: number;
//   igstTaxPercentage: number;
//   isServiceHSN: boolean;
// }

// interface Transporter {
//   transporterID: number;
//   transporterName: string;
//   gstNo: string;
// }

// interface InvoiceDetail {
//   transID: number;
//   productMasterID?: number;
//   productCode: string;
//   jobName: string;
//   narration1: string;
//   quantity: number;
//   freeQuantity?: number;
//   rate: number;
//   rateType: string;
//   purchaseUnit: string;
//   basicAmount: number;
//   discountPercentage: number;
//   discountAmount: number;
//   taxableAmount: number;
//   productHSNID: number;
//   hsnCode: string;
//   isService: string;
//   gstPercentage: number;
//   cgstPercentage: number;
//   sgstPercentage: number;
//   igstPercentage: number;
//   cgstAmount: number;
//   sgstAmount: number;
//   igstAmount: number;
//   grossAmount: number;
//   netAmount: number;
// }

// interface TaxDetail {
//   transID: number;
//   ledgerID: number;
//   ledgerName: string;
//   taxPercentage: number;
//   amount: number;
//   taxInAmount: boolean;
//   isComulative: boolean;
//   gstApplicable: boolean;
//   calculatedON: string;
//   taxType: string;
//   gstLedgerType: string;
// }

// // ===== MAIN COMPONENT =====

// export const InvoiceManagement: React.FC = () => {
//   const router = useRouter();

//   // Loading States
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [showError, setShowError] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   // Master Data
//   const [voucherTypes, setVoucherTypes] = useState<VoucherType[]>([]);
//   const [clients, setClients] = useState<Client[]>([]);
//   const [consignees, setConsignees] = useState<Consignee[]>([]);
//   const [transporters, setTransporters] = useState<Transporter[]>([]);
//   const [hsnGroups, setHsnGroups] = useState<ProductHSN[]>([]);
//   const [currencies, setCurrencies] = useState<any[]>([]);
//   const [purchaseUnits, setPurchaseUnits] = useState<string[]>([]);

//   // Form State
//   const [selectedVoucherType, setSelectedVoucherType] = useState<number>(0);
//   const [selectedClient, setSelectedClient] = useState<number>(0);
//   const [selectedConsignee, setSelectedConsignee] = useState<number>(0);
//   const [selectedTransporter, setSelectedTransporter] = useState<number>(0);

//   const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
//   const [invoiceType, setInvoiceType] = useState<string>('GST Sales');
//   const [documentType, setDocumentType] = useState<string>('INV');
//   const [isExport, setIsExport] = useState<boolean>(false);
//   const [currencyCode, setCurrencyCode] = useState<string>('INR');
//   const [conversionRate, setConversionRate] = useState<number>(1);

//   // Grid Data
//   const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail[]>([]);
//   const [taxDetails, setTaxDetails] = useState<TaxDetail[]>([]);

//   // Transport & Other Fields
//   const [vehicleNo, setVehicleNo] = useState<string>('');
//   const [ewayBillNo, setEwayBillNo] = useState<string>('');
//   const [ewayBillDate, setEwayBillDate] = useState<string>('');
//   const [destination, setDestination] = useState<string>('');
//   const [podNo, setPodNo] = useState<string>('');
//   const [freight, setFreight] = useState<string>('Paid');
//   const [narration, setNarration] = useState<string>('');

//   // Export Fields
//   const [originCountry, setOriginCountry] = useState<string>('India');
//   const [destinationCountry, setDestinationCountry] = useState<string>('');
//   const [loadingPort, setLoadingPort] = useState<string>('');
//   const [dischargePort, setDischargePort] = useState<string>('');
//   const [paymentTerms, setPaymentTerms] = useState<string>('');
//   const [deliveryTerms, setDeliveryTerms] = useState<string>('');

//   // Tab State
//   const [activeTab, setActiveTab] = useState<'details' | 'transport' | 'export'>('details');

//   // Calculated Totals
//   const [totals, setTotals] = useState({
//     totalQuantity: 0,
//     totalBasicAmount: 0,
//     totalDiscountAmount: 0,
//     totalTaxableAmount: 0,
//     totalCGSTAmount: 0,
//     totalSGSTAmount: 0,
//     totalIGSTAmount: 0,
//     totalGrossAmount: 0,
//     tcsPercentage: 0,
//     tcsAmount: 0,
//     roundOff: 0,
//     netAmount: 0
//   });

//   // ===== INITIAL LOAD =====

//   useEffect(() => {
//     loadMasterData();
//   }, []);

//   const loadMasterData = async () => {
//     try {
//       setLoading(true);

//       // Load all master data in parallel
//       const [
//         voucherRes,
//         clientRes,
//         transporterRes,
//         hsnRes,
//         currencyRes,
//         unitRes
//       ] = await Promise.all([
//         invoiceApi.getVoucherTypes(),
//         invoiceApi.getClients(),
//         invoiceApi.getTransporters(),
//         invoiceApi.getProductHSNGroups(false),
//         invoiceApi.getCurrencies(),
//         invoiceApi.getPurchaseUnits()
//       ]);

//       if (voucherRes.success && Array.isArray(voucherRes.data)) {
//         setVoucherTypes(voucherRes.data);
//       }
//       if (clientRes.success && Array.isArray(clientRes.data)) {
//         setClients(clientRes.data);
//       }
//       if (transporterRes.success && Array.isArray(transporterRes.data)) {
//         setTransporters(transporterRes.data);
//       }
//       if (hsnRes.success && Array.isArray(hsnRes.data)) {
//         setHsnGroups(hsnRes.data);
//       }
//       if (currencyRes.success && Array.isArray(currencyRes.data)) {
//         setCurrencies(currencyRes.data);
//       }
//       if (unitRes.success && Array.isArray(unitRes.data)) {
//         setPurchaseUnits(unitRes.data);
//       }

//     } catch (error: any) {
//       console.error('Error loading master data:', error);
//       setErrorMessage(error.message || 'Failed to load master data');
//       setShowError(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadConsignees = async (clientId: number) => {
//     try {
//       const res = await invoiceApi.getConsignees(clientId);
//       if (res.success && Array.isArray(res.data)) {
//         setConsignees(res.data);
//       }
//     } catch (error) {
//       console.error('Error loading consignees:', error);
//     }
//   };

//   // ===== CALCULATION LOGIC =====

//   const calculateLineItem = (detail: InvoiceDetail): InvoiceDetail => {
//     // Basic Amount
//     detail.basicAmount = detail.quantity * detail.rate;

//     // Discount
//     detail.discountAmount = (detail.basicAmount * detail.discountPercentage) / 100;

//     // Taxable Amount
//     detail.taxableAmount = detail.basicAmount - detail.discountAmount;

//     // GST Calculations
//     detail.cgstAmount = (detail.taxableAmount * detail.cgstPercentage) / 100;
//     detail.sgstAmount = (detail.taxableAmount * detail.sgstPercentage) / 100;
//     detail.igstAmount = (detail.taxableAmount * detail.igstPercentage) / 100;

//     // Gross Amount
//     detail.grossAmount = detail.taxableAmount + detail.cgstAmount + detail.sgstAmount + detail.igstAmount;

//     // Net Amount
//     detail.netAmount = detail.grossAmount;

//     return detail;
//   };

//   const recalculateTotals = () => {
//     let totalQty = 0;
//     let totalBasic = 0;
//     let totalDiscount = 0;
//     let totalTaxable = 0;
//     let totalCGST = 0;
//     let totalSGST = 0;
//     let totalIGST = 0;
//     let totalGross = 0;

//     invoiceDetails.forEach(detail => {
//       totalQty += detail.quantity;
//       totalBasic += detail.basicAmount;
//       totalDiscount += detail.discountAmount;
//       totalTaxable += detail.taxableAmount;
//       totalCGST += detail.cgstAmount;
//       totalSGST += detail.sgstAmount;
//       totalIGST += detail.igstAmount;
//       totalGross += detail.grossAmount;
//     });

//     // Add tax details (additional charges)
//     taxDetails.forEach(tax => {
//       totalGross += tax.amount;
//     });

//     // TCS Calculation
//     const tcsPerc = totals.tcsPercentage;
//     const tcsAmt = (totalGross * tcsPerc) / 100;

//     // Round Off
//     const beforeRound = totalGross + tcsAmt;
//     const rounded = Math.round(beforeRound);
//     const roundOff = rounded - beforeRound;

//     setTotals({
//       totalQuantity: totalQty,
//       totalBasicAmount: totalBasic,
//       totalDiscountAmount: totalDiscount,
//       totalTaxableAmount: totalTaxable,
//       totalCGSTAmount: totalCGST,
//       totalSGSTAmount: totalSGST,
//       totalIGSTAmount: totalIGST,
//       totalGrossAmount: totalGross,
//       tcsPercentage: tcsPerc,
//       tcsAmount: tcsAmt,
//       roundOff: roundOff,
//       netAmount: rounded
//     });
//   };

//   useEffect(() => {
//     recalculateTotals();
//   }, [invoiceDetails, taxDetails, totals.tcsPercentage]);

//   // ===== GRID OPERATIONS =====

//   const addNewLine = () => {
//     const newLine: InvoiceDetail = {
//       transID: invoiceDetails.length + 1,
//       productCode: '',
//       jobName: '',
//       narration1: '',
//       quantity: 0,
//       rate: 0,
//       rateType: 'Per Unit',
//       purchaseUnit: 'KG',
//       basicAmount: 0,
//       discountPercentage: 0,
//       discountAmount: 0,
//       taxableAmount: 0,
//       productHSNID: 0,
//       hsnCode: '',
//       isService: 'No',
//       gstPercentage: 18,
//       cgstPercentage: 9,
//       sgstPercentage: 9,
//       igstPercentage: 0,
//       cgstAmount: 0,
//       sgstAmount: 0,
//       igstAmount: 0,
//       grossAmount: 0,
//       netAmount: 0
//     };
//     setInvoiceDetails([...invoiceDetails, newLine]);
//   };

//   const updateLine = (index: number, field: keyof InvoiceDetail, value: any) => {
//     const updated = [...invoiceDetails];
//     updated[index] = { ...updated[index], [field]: value };
//     updated[index] = calculateLineItem(updated[index]);
//     setInvoiceDetails(updated);
//   };

//   const deleteLine = (index: number) => {
//     const updated = invoiceDetails.filter((_, i) => i !== index);
//     setInvoiceDetails(updated);
//   };

//   const addTaxLine = () => {
//     const newTax: TaxDetail = {
//       transID: taxDetails.length + 1,
//       ledgerID: 0,
//       ledgerName: '',
//       taxPercentage: 0,
//       amount: 0,
//       taxInAmount: false,
//       isComulative: false,
//       gstApplicable: false,
//       calculatedON: 'Value',
//       taxType: '',
//       gstLedgerType: ''
//     };
//     setTaxDetails([...taxDetails, newTax]);
//   };

//   const updateTaxLine = (index: number, field: keyof TaxDetail, value: any) => {
//     const updated = [...taxDetails];
//     updated[index] = { ...updated[index], [field]: value };
//     setTaxDetails(updated);
//   };

//   const deleteTaxLine = (index: number) => {
//     const updated = taxDetails.filter((_, i) => i !== index);
//     setTaxDetails(updated);
//   };

//   // ===== PRINT INVOICE =====

//   const generateInvoiceHTML = (data: any) => {
//     const itemRows = data.items.map((item: any) => `
//       <tr style="border-bottom: 1px solid #e2e8f0;">
//         <td style="padding: 4px 6px; font-size: 10px; text-align: center;">${item.srNo}</td>
//         <td style="padding: 4px 6px; font-size: 10px;">${item.productCode || '-'}</td>
//         <td style="padding: 4px 6px; font-size: 10px;">${item.description || '-'}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: right;">${item.quantity.toFixed(2)}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: center;">${item.unit}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: right;">₹${item.rate.toFixed(2)}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: right;">₹${item.taxableAmount.toFixed(2)}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: right;">₹${item.cgstAmount.toFixed(2)}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: right;">₹${item.sgstAmount.toFixed(2)}</td>
//         <td style="padding: 4px 6px; font-size: 10px; text-align: right; font-weight: 600;">₹${item.netAmount.toFixed(2)}</td>
//       </tr>
//     `).join('');

//     const chargeRows = data.charges.length > 0 ? data.charges.map((charge: any) => `
//       <tr>
//         <td style="padding: 3px 0; font-size: 10px;">${charge.ledgerName}</td>
//         <td style="padding: 3px 0; font-size: 10px; text-align: right;">₹${charge.amount.toFixed(2)}</td>
//       </tr>
//     `).join('') : '<tr><td colspan="2" style="padding: 3px 0; font-size: 10px; text-align: center; color: #94a3b8;">No additional charges</td></tr>';

//     return `
//       <div style="padding: 15mm; max-width: 210mm; margin: 0 auto; background: white; font-family: Arial, sans-serif;">

//         <!-- Header -->
//         <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">
//           <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1e40af;">INVOICE</h1>
//         </div>

//         <!-- Invoice Details - 3 Parts in Grid -->
//         <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; background: #f1f5f9; padding: 8px; border-radius: 4px;">
//           <div>
//             <div style="font-size: 9px; color: #64748b; font-weight: bold;">VOUCHER TYPE</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.voucherType}</div>
//           </div>
//           <div>
//             <div style="font-size: 9px; color: #64748b; font-weight: bold;">PREFIX</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.invoiceNo.split('-')[0] || 'SCRP'}</div>
//           </div>
//           <div>
//             <div style="font-size: 9px; color: #64748b; font-weight: bold;">INVOICE NO</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.invoiceNo}</div>
//           </div>
//           <div>
//             <div style="font-size: 9px; color: #64748b; font-weight: bold;">DATE</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.invoiceDate}</div>
//           </div>
//           <div>
//             <div style="font-size: 9px; color: #64748b; font-weight: bold;">TRANSPORTER</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.transport.transporterName || '-'}</div>
//           </div>
//           <div>
//             <div style="font-size: 9px; color: #64748b; font-weight: bold;">VEHICLE NO</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.transport.vehicleNo || '-'}</div>
//           </div>
//         </div>

//         <!-- Bill To & Ship To -->
//         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
//           <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px;">
//             <div style="font-size: 10px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">BILL TO:</div>
//             <div style="font-size: 11px; font-weight: 600;">${data.client.name}</div>
//             ${data.client.address ? `<div style="font-size: 9px; color: #64748b;">${data.client.address}</div>` : ''}
//             ${data.client.city ? `<div style="font-size: 9px; color: #64748b;">${data.client.city}, ${data.client.state} - ${data.client.pinCode}</div>` : ''}
//             ${data.client.gstin ? `<div style="font-size: 9px;"><span style="font-weight: 600;">GSTIN:</span> ${data.client.gstin}</div>` : ''}
//             ${data.client.phone ? `<div style="font-size: 9px;"><span style="font-weight: 600;">Phone:</span> ${data.client.phone}</div>` : ''}
//           </div>
//           <div style="border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px;">
//             <div style="font-size: 10px; font-weight: bold; color: #1e40af; margin-bottom: 4px;">SHIP TO:</div>
//             ${data.consignee ? `
//               <div style="font-size: 11px; font-weight: 600;">${data.consignee.name}</div>
//               ${data.consignee.address ? `<div style="font-size: 9px; color: #64748b;">${data.consignee.address}</div>` : ''}
//               ${data.consignee.city ? `<div style="font-size: 9px; color: #64748b;">${data.consignee.city}, ${data.consignee.state} - ${data.consignee.pinCode}</div>` : ''}
//               ${data.consignee.gstin ? `<div style="font-size: 9px;"><span style="font-weight: 600;">GSTIN:</span> ${data.consignee.gstin}</div>` : ''}
//             ` : `<div style="font-size: 10px; color: #94a3b8;">Same as Bill To</div>`}
//           </div>
//         </div>

//         <!-- Items Table -->
//         <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #e2e8f0;">
//           <thead>
//             <tr style="background: #1e40af; color: white;">
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">SR</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: left; border-right: 1px solid rgba(255,255,255,0.2);">CODE</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: left; border-right: 1px solid rgba(255,255,255,0.2);">DESCRIPTION</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: right; border-right: 1px solid rgba(255,255,255,0.2);">QTY</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: center; border-right: 1px solid rgba(255,255,255,0.2);">UNIT</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: right; border-right: 1px solid rgba(255,255,255,0.2);">RATE</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: right; border-right: 1px solid rgba(255,255,255,0.2);">TAXABLE</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: right; border-right: 1px solid rgba(255,255,255,0.2);">CGST</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: right; border-right: 1px solid rgba(255,255,255,0.2);">SGST</th>
//               <th style="padding: 4px 6px; font-size: 9px; font-weight: bold; text-align: right;">NET AMT</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${itemRows}
//           </tbody>
//         </table>

//         <!-- Summary Section -->
//         <div style="display: grid; grid-template-columns: 1fr 300px; gap: 12px;">

//           <!-- Additional Charges -->
//           <div>
//             <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px; color: #1e40af;">ADDITIONAL CHARGES:</div>
//             <table style="width: 100%;">
//               <tbody>
//                 ${chargeRows}
//               </tbody>
//             </table>
//             ${data.narration ? `
//               <div style="margin-top: 8px;">
//                 <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px; color: #1e40af;">NARRATION:</div>
//                 <div style="font-size: 9px; color: #475569;">${data.narration}</div>
//               </div>
//             ` : ''}
//           </div>

//           <!-- Totals -->
//           <div style="border: 2px solid #1e40af; padding: 8px; border-radius: 4px; background: #f1f5f9;">
//             <table style="width: 100%;">
//               <tr>
//                 <td style="padding: 2px 0; font-size: 10px;">Taxable Amount:</td>
//                 <td style="padding: 2px 0; font-size: 10px; text-align: right; font-weight: 600;">₹${data.totals.totalTaxableAmount.toFixed(2)}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 2px 0; font-size: 10px;">CGST Amount:</td>
//                 <td style="padding: 2px 0; font-size: 10px; text-align: right; font-weight: 600;">₹${data.totals.totalCGSTAmount.toFixed(2)}</td>
//               </tr>
//               <tr>
//                 <td style="padding: 2px 0; font-size: 10px;">SGST Amount:</td>
//                 <td style="padding: 2px 0; font-size: 10px; text-align: right; font-weight: 600;">₹${data.totals.totalSGSTAmount.toFixed(2)}</td>
//               </tr>
//               ${data.totals.totalIGSTAmount > 0 ? `
//                 <tr>
//                   <td style="padding: 2px 0; font-size: 10px;">IGST Amount:</td>
//                   <td style="padding: 2px 0; font-size: 10px; text-align: right; font-weight: 600;">₹${data.totals.totalIGSTAmount.toFixed(2)}</td>
//                 </tr>
//               ` : ''}
//               ${data.totals.totalCharges > 0 ? `
//                 <tr>
//                   <td style="padding: 2px 0; font-size: 10px;">Additional Charges:</td>
//                   <td style="padding: 2px 0; font-size: 10px; text-align: right; font-weight: 600;">₹${data.totals.totalCharges.toFixed(2)}</td>
//                 </tr>
//               ` : ''}
//               <tr>
//                 <td style="padding: 2px 0; font-size: 10px;">Round Off:</td>
//                 <td style="padding: 2px 0; font-size: 10px; text-align: right; font-weight: 600;">₹${data.totals.roundOff.toFixed(2)}</td>
//               </tr>
//               <tr style="border-top: 2px solid #1e40af;">
//                 <td style="padding: 4px 0; font-size: 12px; font-weight: bold; color: #1e40af;">GRAND TOTAL:</td>
//                 <td style="padding: 4px 0; font-size: 14px; font-weight: bold; text-align: right; color: #1e40af;">₹${data.totals.netAmount.toFixed(2)}</td>
//               </tr>
//             </table>
//           </div>
//         </div>

//         <!-- Footer -->
//         <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center;">
//           <div style="font-size: 8px; color: #94a3b8;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
//         </div>

//       </div>
//     `;
//   };

//   const handlePrintPreview = () => {
//     // Prepare invoice data for print
//     const invoicePrintData = {
//       invoiceNo: `${voucherTypes.find(v => v.voucherID === selectedVoucherType)?.prefix || 'INV'}-${Date.now()}`,
//       invoiceDate: invoiceDate,
//       voucherType: voucherTypes.find(v => v.voucherID === selectedVoucherType)?.voucherName || '',
//       client: {
//         name: clients.find(c => c.ledgerID === selectedClient)?.ledgerName || '',
//         address: clients.find(c => c.ledgerID === selectedClient)?.Address1 || '',
//         city: clients.find(c => c.ledgerID === selectedClient)?.City || '',
//         state: clients.find(c => c.ledgerID === selectedClient)?.State || '',
//         pinCode: clients.find(c => c.ledgerID === selectedClient)?.PinCode || '',
//         gstin: clients.find(c => c.ledgerID === selectedClient)?.GSTIN || '',
//         phone: clients.find(c => c.ledgerID === selectedClient)?.Phone || '',
//         email: clients.find(c => c.ledgerID === selectedClient)?.Email || '',
//       },
//       consignee: selectedConsignee > 0 ? {
//         name: consignees.find(c => c.consigneeID === selectedConsignee)?.consigneeName || '',
//         address: consignees.find(c => c.consigneeID === selectedConsignee)?.Address || '',
//         city: consignees.find(c => c.consigneeID === selectedConsignee)?.Destination || '',
//         state: consignees.find(c => c.consigneeID === selectedConsignee)?.State || '',
//         pinCode: consignees.find(c => c.consigneeID === selectedConsignee)?.PinCode || '',
//         gstin: consignees.find(c => c.consigneeID === selectedConsignee)?.GSTIN || '',
//       } : undefined,
//       transport: {
//         transporterName: transporters.find(t => t.transporterID === selectedTransporter)?.transporterName || '',
//         vehicleNo: vehicleNo,
//         ewayBillNo: ewayBillNo,
//         destination: destination,
//         freight: freight,
//       },
//       items: invoiceDetails.map((item, index) => ({
//         srNo: index + 1,
//         productCode: item.productCode,
//         description: item.jobName,
//         quantity: item.quantity,
//         unit: item.purchaseUnit,
//         rate: item.rate,
//         amount: item.basicAmount,
//         discountAmount: item.discountAmount,
//         taxableAmount: item.taxableAmount,
//         cgstAmount: item.cgstAmount,
//         sgstAmount: item.sgstAmount,
//         igstAmount: item.igstAmount,
//         netAmount: item.netAmount,
//       })),
//       charges: taxDetails.map(tax => ({
//         ledgerName: tax.ledgerName,
//         taxPercentage: tax.taxPercentage,
//         amount: tax.amount,
//       })),
//       totals: {
//         totalQuantity: totals.totalQuantity,
//         totalBasicAmount: totals.totalBasicAmount,
//         totalDiscountAmount: totals.totalDiscountAmount,
//         totalTaxableAmount: totals.totalTaxableAmount,
//         totalCGSTAmount: totals.totalCGSTAmount,
//         totalSGSTAmount: totals.totalSGSTAmount,
//         totalIGSTAmount: totals.totalIGSTAmount,
//         totalCharges: taxDetails.reduce((sum, tax) => sum + tax.amount, 0),
//         roundOff: totals.roundOff,
//         netAmount: totals.netAmount,
//       },
//       narration: narration,
//     };

//     // Open print preview in new window
//     const printWindow = window.open('', '_blank');
//     if (printWindow) {
//       printWindow.document.write(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <title>Invoice - ${invoicePrintData.invoiceNo}</title>
//             <style>
//               * {
//                 margin: 0;
//                 padding: 0;
//                 box-sizing: border-box;
//               }
//               body {
//                 font-family: Arial, sans-serif;
//                 background: #f5f5f5;
//               }
//               .no-print {
//                 position: sticky;
//                 top: 0;
//                 background: #1e40af;
//                 color: white;
//                 padding: 12px 20px;
//                 display: flex;
//                 justify-content: space-between;
//                 align-items: center;
//                 box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//                 z-index: 100;
//               }
//               .no-print h1 {
//                 font-size: 18px;
//                 font-weight: bold;
//               }
//               .no-print button {
//                 background: white;
//                 color: #1e40af;
//                 border: none;
//                 padding: 8px 20px;
//                 border-radius: 4px;
//                 font-weight: bold;
//                 cursor: pointer;
//                 transition: all 0.2s;
//               }
//               .no-print button:hover {
//                 background: #f1f5f9;
//               }
//               @media print {
//                 body {
//                   margin: 0;
//                   padding: 0;
//                   background: white;
//                 }
//                 .no-print {
//                   display: none !important;
//                 }
//                 @page {
//                   size: A4;
//                   margin: 0;
//                 }
//               }
//             </style>
//           </head>
//           <body>
//             <div class="no-print">
//               <h1>📄 Invoice Preview - ${invoicePrintData.invoiceNo}</h1>
//               <button onclick="window.print()">🖨️ Print Invoice</button>
//             </div>
//             ${generateInvoiceHTML(invoicePrintData)}
//           </body>
//         </html>
//       `);
//       printWindow.document.close();
//     }
//   };

//   // ===== SAVE INVOICE =====

//   const handleSave = async () => {
//     try {
//       // Validation
//       if (!selectedVoucherType) {
//         setErrorMessage('Please select a voucher type');
//         setShowError(true);
//         return;
//       }
//       if (!selectedClient) {
//         setErrorMessage('Please select a client');
//         setShowError(true);
//         return;
//       }
//       if (invoiceDetails.length === 0) {
//         setErrorMessage('Please add at least one invoice line');
//         setShowError(true);
//         return;
//       }

//       setSaving(true);

//       const payload = {
//         invVoucherID: selectedVoucherType,
//         prefix: voucherTypes.find(v => v.voucherID === selectedVoucherType)?.prefix || '',
//         invoiceMain: {
//           voucherID: selectedVoucherType,
//           voucherDate: new Date(invoiceDate),
//           ledgerID: selectedClient,
//           consigneeLedgerID: selectedConsignee || null,
//           salesLedgerID: null,
//           invoiceType: invoiceType,
//           documentType: documentType,
//           isExport: isExport,
//           currencyCode: currencyCode,
//           currConversionValue: conversionRate,
//           vehicleNo: vehicleNo,
//           transporterID: selectedTransporter || null,
//           ewayBillNumber: ewayBillNo,
//           ewayBillDate: ewayBillDate ? new Date(ewayBillDate) : null,
//           freight: freight,
//           podNo: podNo,
//           destination: destination,
//           narration: narration,
//           originCountry: originCountry,
//           destinationCountry: destinationCountry,
//           loadingPort: loadingPort,
//           dischargePort: dischargePort,
//           paymentTerms: paymentTerms,
//           deliveryTerms: deliveryTerms,
//           totalQuantity: totals.totalQuantity,
//           totalBasicAmount: totals.totalBasicAmount,
//           totalDiscountAmount: totals.totalDiscountAmount,
//           totalCGSTAmount: totals.totalCGSTAmount,
//           totalSGSTAmount: totals.totalSGSTAmount,
//           totalIGSTAmount: totals.totalIGSTAmount,
//           tcsPercentage: totals.tcsPercentage,
//           tcsAmount: totals.tcsAmount,
//           roundOffTax: totals.roundOff,
//           netAmount: totals.netAmount
//         },
//         invoiceDetails: invoiceDetails,
//         taxDetails: taxDetails,
//         txtNetAmt: totals.netAmount,
//         currencyCode: currencyCode,
//         arrJC: []
//       };

//       const res = await invoiceApi.saveInvoice(payload);

//       if (res.success) {
//         setShowSuccess(true);
//         setTimeout(() => {
//           setShowSuccess(false);
//           // Clear form or redirect
//           router.push('/scrap');
//         }, 2000);
//       } else {
//         setErrorMessage(res.message || 'Failed to save invoice');
//         setShowError(true);
//       }
//     } catch (error: any) {
//       console.error('Error saving invoice:', error);
//       setErrorMessage(error.message || 'Failed to save invoice');
//       setShowError(true);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ===== RENDER =====

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <Skeleton className="h-12 w-64" />
//         <Skeleton className="h-96 w-full" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 pb-24 overflow-auto">

//       {/* Success Notification */}
//       {showSuccess && (
//         <div className="fixed top-20 right-5 z-[100] bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center animate-in slide-in-from-right-5 fade-in">
//           <CheckCircle2 className="mr-3" size={24} />
//           <div>
//             <h4 className="font-bold">Invoice Saved!</h4>
//             <p className="text-xs text-green-100">Invoice has been saved successfully.</p>
//           </div>
//         </div>
//       )}

//       {/* Error Notification */}
//       {showError && (
//         <div className="fixed top-20 right-5 z-[100] bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center animate-in slide-in-from-right-5 fade-in">
//           <AlertCircle className="mr-3" size={24} />
//           <div className="flex-1">
//             <h4 className="font-bold">Error</h4>
//             <p className="text-xs text-red-100">{errorMessage}</p>
//           </div>
//           <button onClick={() => setShowError(false)} className="ml-4">
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
//           <div className="flex items-center space-x-3">
//             <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
//               <FileText className="text-blue-600" size={20} />
//             </div>
//             <div>
//               <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Invoice Management</h1>
//               <p className="text-xs sm:text-sm text-slate-500">Create and manage sales invoices</p>
//             </div>
//           </div>
//           <div className="flex space-x-2 w-full sm:w-auto">
//             <button
//               onClick={() => router.back()}
//               className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center text-sm"
//             >
//               <X size={14} className="mr-1" />
//               Cancel
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="flex-1 sm:flex-none px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center shadow-md disabled:opacity-50 text-sm"
//             >
//               <Save size={14} className="mr-1" />
//               {saving ? 'Saving...' : 'Save'}
//             </button>
//           </div>
//         </div>

//         {/* Basic Details Grid - Mobile Optimized: 2 cols on mobile, 3 on tablet, 6 on desktop */}
//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
//           <div className="col-span-2 sm:col-span-3 lg:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">VOUCHER TYPE *</label>
//             <SearchableSelect
//               options={voucherTypes.map(v => ({
//                 value: v.voucherID,
//                 label: `${v.voucherName} - ${v.prefix}`
//               }))}
//               value={selectedVoucherType.toString()}
//               onChange={(val) => setSelectedVoucherType(Number(val))}
//               placeholder="Select Voucher"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">DATE *</label>
//             <input
//               type="date"
//               value={invoiceDate}
//               onChange={(e) => setInvoiceDate(e.target.value)}
//               className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">TYPE</label>
//             <select
//               value={invoiceType}
//               onChange={(e) => setInvoiceType(e.target.value)}
//               className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             >
//               <option value="GST Sales">GST</option>
//               <option value="VAT Sales">VAT</option>
//               <option value="Export Sales">Export</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">DOC</label>
//             <select
//               value={documentType}
//               onChange={(e) => setDocumentType(e.target.value)}
//               className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             >
//               <option value="INV">INV</option>
//               <option value="CRN">CRN</option>
//               <option value="DBN">DBN</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">EXPORT</label>
//             <select
//               value={isExport ? 'yes' : 'no'}
//               onChange={(e) => setIsExport(e.target.value === 'yes')}
//               className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             >
//               <option value="no">No</option>
//               <option value="yes">Yes</option>
//             </select>
//           </div>

//           <div className="col-span-2 sm:col-span-3 lg:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">CLIENT / PARTY *</label>
//             <SearchableSelect
//               options={clients.map(c => ({
//                 value: c.ledgerID,
//                 label: `${c.ledgerName} - ${c.state}`
//               }))}
//               value={selectedClient.toString()}
//               onChange={(val) => {
//                 const clientId = Number(val);
//                 setSelectedClient(clientId);
//                 if (clientId > 0) loadConsignees(clientId);
//               }}
//               placeholder="Select Client"
//             />
//           </div>

//           <div className="col-span-2 sm:col-span-3 lg:col-span-2">
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">CONSIGNEE</label>
//             <SearchableSelect
//               options={[
//                 { value: 0, label: 'Same as Client' },
//                 ...consignees.map(c => ({
//                   value: c.consigneeID,
//                   label: `${c.consigneeName} - ${c.city}`
//                 }))
//               ]}
//               value={selectedConsignee.toString()}
//               onChange={(val) => setSelectedConsignee(Number(val))}
//               placeholder="Same as Client"
//             />
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">CURRENCY</label>
//             <select
//               value={currencyCode}
//               onChange={(e) => setCurrencyCode(e.target.value)}
//               className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             >
//               <option value="INR">INR</option>
//               <option value="USD">USD</option>
//               <option value="EUR">EUR</option>
//               <option value="GBP">GBP</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-xs font-bold text-slate-500 mb-1.5">RATE</label>
//             <input
//               type="number"
//               step="0.01"
//               value={conversionRate}
//               onChange={(e) => setConversionRate(Number(e.target.value))}
//               className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Tabs - Mobile Optimized */}
//       <div className="flex space-x-1 sm:space-x-2 border-b border-slate-200 bg-white px-2 sm:px-4 overflow-x-auto">
//         <button
//           onClick={() => setActiveTab('details')}
//           className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-all flex items-center text-xs sm:text-sm whitespace-nowrap ${
//             activeTab === 'details'
//               ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
//               : 'text-slate-500 hover:text-slate-700'
//           }`}
//         >
//           <Package size={14} className="mr-1 sm:mr-2" />
//           Details
//         </button>
//         <button
//           onClick={() => setActiveTab('transport')}
//           className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-all flex items-center text-xs sm:text-sm whitespace-nowrap ${
//             activeTab === 'transport'
//               ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
//               : 'text-slate-500 hover:text-slate-700'
//           }`}
//         >
//           <Truck size={14} className="mr-1 sm:mr-2" />
//           Transport
//         </button>
//         {isExport && (
//           <button
//             onClick={() => setActiveTab('export')}
//             className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-all flex items-center text-xs sm:text-sm whitespace-nowrap ${
//               activeTab === 'export'
//                 ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
//                 : 'text-slate-500 hover:text-slate-700'
//             }`}
//           >
//             <MapPin size={14} className="mr-1 sm:mr-2" />
//             Export
//           </button>
//         )}
//       </div>

//       {/* Invoice Details Tab */}
//       {activeTab === 'details' && (
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-bold text-slate-800">Product / Service Details</h3>
//             <button
//               onClick={addNewLine}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center text-sm"
//             >
//               <Plus size={16} className="mr-2" />
//               Add Line
//             </button>
//           </div>

//           {/* Invoice Grid */}
//           <div className="overflow-x-auto">
//             <table className="w-full border-collapse">
//               <thead>
//                 <tr className="bg-slate-50 border-b-2 border-slate-200">
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">SR</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">PRODUCT CODE</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">JOB NAME</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">QTY</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">UNIT</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">RATE</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">BASIC AMT</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">DISC %</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">TAXABLE</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">GST %</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">CGST</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">SGST</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">NET AMT</th>
//                   <th className="p-3 text-left text-xs font-bold text-slate-600">ACTION</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {invoiceDetails.map((detail, index) => (
//                   <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
//                     <td className="p-3 text-sm">{index + 1}</td>
//                     <td className="p-3">
//                       <input
//                         type="text"
//                         value={detail.productCode}
//                         onChange={(e) => updateLine(index, 'productCode', e.target.value)}
//                         className="w-32 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
//                         placeholder="Code"
//                       />
//                     </td>
//                     <td className="p-3">
//                       <input
//                         type="text"
//                         value={detail.jobName}
//                         onChange={(e) => updateLine(index, 'jobName', e.target.value)}
//                         className="w-40 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
//                         placeholder="Description"
//                       />
//                     </td>
//                     <td className="p-3">
//                       <input
//                         type="number"
//                         value={detail.quantity || ''}
//                         onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
//                         className="w-20 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right"
//                       />
//                     </td>
//                     <td className="p-3">
//                       <select
//                         value={detail.purchaseUnit}
//                         onChange={(e) => updateLine(index, 'purchaseUnit', e.target.value)}
//                         className="w-20 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
//                       >
//                         <option value="KG">KG</option>
//                         <option value="NOS">NOS</option>
//                         <option value="PCS">PCS</option>
//                         <option value="MTR">MTR</option>
//                       </select>
//                     </td>
//                     <td className="p-3">
//                       <input
//                         type="number"
//                         value={detail.rate || ''}
//                         onChange={(e) => updateLine(index, 'rate', Number(e.target.value))}
//                         className="w-24 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right"
//                       />
//                     </td>
//                     <td className="p-3 text-sm text-right font-medium text-slate-700">
//                       {formatNumber(detail.basicAmount)}
//                     </td>
//                     <td className="p-3">
//                       <input
//                         type="number"
//                         value={detail.discountPercentage || ''}
//                         onChange={(e) => updateLine(index, 'discountPercentage', Number(e.target.value))}
//                         className="w-16 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right"
//                       />
//                     </td>
//                     <td className="p-3 text-sm text-right font-medium text-slate-700">
//                       {formatNumber(detail.taxableAmount)}
//                     </td>
//                     <td className="p-3">
//                       <input
//                         type="number"
//                         value={detail.gstPercentage || ''}
//                         onChange={(e) => {
//                           const gst = Number(e.target.value);
//                           updateLine(index, 'gstPercentage', gst);
//                           updateLine(index, 'cgstPercentage', gst / 2);
//                           updateLine(index, 'sgstPercentage', gst / 2);
//                         }}
//                         className="w-16 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right"
//                       />
//                     </td>
//                     <td className="p-3 text-sm text-right font-medium text-green-600">
//                       {formatNumber(detail.cgstAmount)}
//                     </td>
//                     <td className="p-3 text-sm text-right font-medium text-green-600">
//                       {formatNumber(detail.sgstAmount)}
//                     </td>
//                     <td className="p-3 text-sm text-right font-bold text-slate-800">
//                       {formatNumber(detail.netAmount)}
//                     </td>
//                     <td className="p-3">
//                       <button
//                         onClick={() => deleteLine(index)}
//                         className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all"
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//                 {invoiceDetails.length === 0 && (
//                   <tr>
//                     <td colSpan={14} className="p-8 text-center text-slate-400">
//                       No invoice lines added. Click "Add Line" to add products/services.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Additional Charges */}
//           <div className="mt-8">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-bold text-slate-800">Additional Charges</h3>
//               <button
//                 onClick={addTaxLine}
//                 className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all flex items-center text-sm"
//               >
//                 <Plus size={16} className="mr-2" />
//                 Add Charge
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="bg-slate-50 border-b-2 border-slate-200">
//                     <th className="p-3 text-left text-xs font-bold text-slate-600">SR</th>
//                     <th className="p-3 text-left text-xs font-bold text-slate-600">DESCRIPTION</th>
//                     <th className="p-3 text-left text-xs font-bold text-slate-600">AMOUNT</th>
//                     <th className="p-3 text-left text-xs font-bold text-slate-600">ACTION</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {taxDetails.map((tax, index) => (
//                     <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
//                       <td className="p-3 text-sm">{index + 1}</td>
//                       <td className="p-3">
//                         <input
//                           type="text"
//                           value={tax.ledgerName || ''}
//                           onChange={(e) => updateTaxLine(index, 'ledgerName', e.target.value)}
//                           className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
//                           placeholder="e.g., Freight, Packing, Loading Charges"
//                         />
//                       </td>
//                       <td className="p-3">
//                         <input
//                           type="number"
//                           value={tax.amount || ''}
//                           onChange={(e) => updateTaxLine(index, 'amount', Number(e.target.value))}
//                           className="w-32 p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right font-medium"
//                           placeholder="0.00"
//                         />
//                       </td>
//                       <td className="p-3">
//                         <button
//                           onClick={() => deleteTaxLine(index)}
//                           className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all"
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                   {taxDetails.length === 0 && (
//                     <tr>
//                       <td colSpan={4} className="p-8 text-center text-slate-400">
//                         No additional charges added. Click "Add Charge" to add taxes, freight, etc.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Transport Details Tab - Mobile Optimized */}
//       {activeTab === 'transport' && (
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
//           <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Transport & Logistics</h3>
//           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
//             <div className="col-span-2 sm:col-span-1">
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">TRANSPORTER</label>
//               <SearchableSelect
//                 options={transporters.map(t => ({
//                   value: t.transporterID,
//                   label: t.transporterName
//                 }))}
//                 value={selectedTransporter.toString()}
//                 onChange={(val) => setSelectedTransporter(Number(val))}
//                 placeholder="Select"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">VEHICLE NO</label>
//               <input
//                 type="text"
//                 value={vehicleNo}
//                 onChange={(e) => setVehicleNo(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="MH12AB1234"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">E-WAY BILL</label>
//               <input
//                 type="text"
//                 value={ewayBillNo}
//                 onChange={(e) => setEwayBillNo(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="Bill No"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">BILL DATE</label>
//               <input
//                 type="date"
//                 value={ewayBillDate}
//                 onChange={(e) => setEwayBillDate(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">DESTINATION</label>
//               <input
//                 type="text"
//                 value={destination}
//                 onChange={(e) => setDestination(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="City"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">POD NO</label>
//               <input
//                 type="text"
//                 value={podNo}
//                 onChange={(e) => setPodNo(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="POD"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">FREIGHT</label>
//               <select
//                 value={freight}
//                 onChange={(e) => setFreight(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//               >
//                 <option value="Paid">Paid</option>
//                 <option value="ToPay">To Pay</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Export Details Tab - Mobile Optimized */}
//       {activeTab === 'export' && isExport && (
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
//           <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Export Documentation</h3>
//           <div className="grid grid-cols-2 gap-3 sm:gap-4">
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">ORIGIN</label>
//               <input
//                 type="text"
//                 value={originCountry}
//                 onChange={(e) => setOriginCountry(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="India"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">DESTINATION</label>
//               <input
//                 type="text"
//                 value={destinationCountry}
//                 onChange={(e) => setDestinationCountry(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="USA"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">LOADING PORT</label>
//               <input
//                 type="text"
//                 value={loadingPort}
//                 onChange={(e) => setLoadingPort(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="Mumbai"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">DISCHARGE PORT</label>
//               <input
//                 type="text"
//                 value={dischargePort}
//                 onChange={(e) => setDischargePort(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="New York"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">PAYMENT TERMS</label>
//               <input
//                 type="text"
//                 value={paymentTerms}
//                 onChange={(e) => setPaymentTerms(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="Net 30"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1.5">DELIVERY TERMS</label>
//               <input
//                 type="text"
//                 value={deliveryTerms}
//                 onChange={(e) => setDeliveryTerms(e.target.value)}
//                 className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//                 placeholder="FOB/CIF"
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Totals Section - Mobile Optimized */}
//       <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-lg p-4 sm:p-6">
//         <div className="flex items-center mb-3 sm:mb-4">
//           <Calculator className="text-blue-600 mr-2" size={18} />
//           <h3 className="text-base sm:text-xl font-bold text-blue-900">Invoice Summary</h3>
//         </div>

//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Quantity</p>
//             <p className="text-lg sm:text-2xl font-bold text-slate-800">{formatNumber(totals.totalQuantity)}</p>
//           </div>

//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Basic</p>
//             <p className="text-lg sm:text-2xl font-bold text-slate-800">₹{formatNumber(totals.totalBasicAmount)}</p>
//           </div>

//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Taxable</p>
//             <p className="text-lg sm:text-2xl font-bold text-slate-800">₹{formatNumber(totals.totalTaxableAmount)}</p>
//           </div>

//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">GST</p>
//             <p className="text-lg sm:text-2xl font-bold text-green-600">
//               ₹{formatNumber(totals.totalCGSTAmount + totals.totalSGSTAmount + totals.totalIGSTAmount)}
//             </p>
//           </div>

//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">CGST</p>
//             <p className="text-base sm:text-xl font-bold text-slate-800">₹{formatNumber(totals.totalCGSTAmount)}</p>
//           </div>

//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">SGST</p>
//             <p className="text-base sm:text-xl font-bold text-slate-800">₹{formatNumber(totals.totalSGSTAmount)}</p>
//           </div>

//           <div className="bg-white rounded-lg p-2 sm:p-4 border border-blue-200">
//             <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Round Off</p>
//             <p className="text-base sm:text-xl font-bold text-slate-800">₹{formatNumber(totals.roundOff)}</p>
//           </div>

//           <div className="bg-blue-600 rounded-lg p-2 sm:p-4 border-2 border-blue-700 shadow-md">
//             <p className="text-[10px] sm:text-xs font-bold text-blue-100 uppercase">Net Amount</p>
//             <p className="text-lg sm:text-2xl font-bold text-white">₹{formatNumber(totals.netAmount)}</p>
//           </div>
//         </div>

//         {/* TCS and Narration - Mobile Optimized */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-2 sm:mt-4">
//           <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-200">
//             <label className="block text-[10px] sm:text-xs font-bold text-slate-500 mb-1.5">TCS %</label>
//             <input
//               type="number"
//               step="0.01"
//               value={totals.tcsPercentage}
//               onChange={(e) => setTotals({ ...totals, tcsPercentage: Number(e.target.value) })}
//               className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//             />
//           </div>

//           <div className="sm:col-span-2 bg-white rounded-lg p-3 sm:p-4 border border-blue-200">
//             <label className="block text-[10px] sm:text-xs font-bold text-slate-500 mb-1.5">NARRATION</label>
//             <textarea
//               value={narration}
//               onChange={(e) => setNarration(e.target.value)}
//               rows={2}
//               className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm"
//               placeholder="Notes or terms..."
//             />
//           </div>
//         </div>
//       </div>

//       {/* Action Buttons - Mobile Optimized */}
//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3">
//         <button
//           onClick={handlePrintPreview}
//           className="w-full sm:w-auto px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center text-xs sm:text-sm"
//         >
//           <Printer size={14} className="mr-1 sm:mr-2" />
//           Print
//         </button>
//         <button className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center text-xs sm:text-sm">
//           <Send size={14} className="mr-1 sm:mr-2" />
//           E-Invoice
//         </button>
//         <button
//           onClick={handleSave}
//           disabled={saving}
//           className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center shadow-md font-bold text-xs sm:text-sm disabled:opacity-50"
//         >
//           <Save size={14} className="mr-1 sm:mr-2" />
//           {saving ? 'Saving...' : 'Save Invoice'}
//         </button>
//       </div>

//     </div>
//   );
// };