// New TAX INVOICE print layout for ShowProcessed page
// This function generates a professional tax invoice matching the provided image format

const generatePrintHTML = (invoiceData: any) => {
    const { MainData, Items } = invoiceData;

    // Helper function to format numbers
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num || 0);
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
