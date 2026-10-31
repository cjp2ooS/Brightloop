import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriod?: string;
  paymentTerms: string;
  workflowStatus: string;
  paymentStatus: string;
  customer: {
    companyName: string;
    contactName: string;
    email: string;
    billingAddress?: string | null;
    taxNumber?: string | null;
  };
  items: Array<{
    productName: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
    variantPrice: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string | null;
}

export function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const primaryColor = '#0F172A'; // Slate-900
      const accentColor = '#2563EB';  // Blue-600
      const mutedColor = '#64748B';   // Slate-500
      const lightBg = '#F8FAFC';      // Slate-50

      // Header: Company Logo / Name
      doc.fontSize(22).font('Helvetica-Bold').fillColor(primaryColor).text('LOOPFLOW', 40, 40);
      doc.fontSize(10).font('Helvetica').fillColor(mutedColor).text('Brightloop Software Inc.', 40, 68);
      doc.text('100 Enterprise Way, Suite 400', 40, 82);
      doc.text('billing@brightloop.io | +1 (800) 555-LOOP', 40, 96);

      // Invoice Title & Meta
      doc.fontSize(18).font('Helvetica-Bold').fillColor(accentColor).text('INVOICE', 350, 40, { align: 'right' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text(`Invoice #: ${data.invoiceNumber}`, 350, 65, { align: 'right' });
      doc.font('Helvetica').fillColor(mutedColor).text(`Date: ${data.invoiceDate}`, 350, 80, { align: 'right' });
      doc.text(`Due Date: ${data.dueDate}`, 350, 95, { align: 'right' });
      if (data.billingPeriod) {
        doc.text(`Period: ${data.billingPeriod}`, 350, 110, { align: 'right' });
      }

      // Divider
      doc.moveTo(40, 130).lineTo(555, 130).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // Bill To section
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('BILL TO:', 40, 145);
      doc.font('Helvetica-Bold').fillColor('#1E293B').text(data.customer.companyName || data.customer.contactName, 40, 160);
      doc.font('Helvetica').fillColor(mutedColor);
      doc.text(`Attn: ${data.customer.contactName}`, 40, 175);
      doc.text(data.customer.email, 40, 190);
      if (data.customer.billingAddress) {
        doc.text(data.customer.billingAddress, 40, 205);
      }
      if (data.customer.taxNumber) {
        doc.text(`Tax / GST ID: ${data.customer.taxNumber}`, 40, 220);
      }

      // Status Badges (Right Box)
      const badgeY = 145;
      doc.rect(380, badgeY, 175, 75).fillAndStroke(lightBg, '#CBD5E1');
      doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor).text('PAYMENT TERMS', 390, badgeY + 10);
      doc.fontSize(11).font('Helvetica').fillColor(primaryColor).text(data.paymentTerms, 390, badgeY + 24);

      doc.fontSize(9).font('Helvetica-Bold').fillColor(mutedColor).text('STATUS', 390, badgeY + 44);
      doc.fontSize(11).font('Helvetica-Bold')
        .fillColor(data.paymentStatus === 'PAID' ? '#16A34A' : data.paymentStatus === 'PARTIALLY_PAID' ? '#D97706' : '#DC2626')
        .text(`${data.workflowStatus} / ${data.paymentStatus}`, 390, badgeY + 56);

      // Line Items Table Header
      let currentY = 255;
      doc.rect(40, currentY, 515, 24).fill('#F1F5F9');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155');
      doc.text('ITEM & DESCRIPTION', 50, currentY + 7);
      doc.text('QTY', 290, currentY + 7, { width: 35, align: 'center' });
      doc.text('UNIT PRICE', 335, currentY + 7, { width: 65, align: 'right' });
      doc.text('DISCOUNT', 410, currentY + 7, { width: 60, align: 'right' });
      doc.text('AMOUNT', 480, currentY + 7, { width: 65, align: 'right' });

      currentY += 28;

      // Table rows
      doc.font('Helvetica').fontSize(9).fillColor('#1E293B');
      for (const item of data.items) {
        const title = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
        const unit = (item.unitPrice + item.variantPrice).toFixed(2);
        
        doc.text(title, 50, currentY, { width: 230 });
        doc.text(item.quantity.toString(), 290, currentY, { width: 35, align: 'center' });
        doc.text(`₹${unit}`, 335, currentY, { width: 65, align: 'right' });
        doc.text(item.discountAmount > 0 ? `-₹${item.discountAmount.toFixed(2)}` : '₹0.00', 410, currentY, { width: 60, align: 'right' });
        doc.text(`₹${item.lineTotal.toFixed(2)}`, 480, currentY, { width: 65, align: 'right' });

        currentY += 24;
        // subtle row divider
        doc.moveTo(40, currentY - 4).lineTo(555, currentY - 4).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
      }

      currentY += 10;

      // Totals Box
      const totalsStartX = 340;
      doc.fontSize(9).font('Helvetica').fillColor(mutedColor);

      doc.text('Subtotal:', totalsStartX, currentY);
      doc.text(`₹${data.subtotal.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });
      currentY += 18;

      if (data.discountTotal > 0) {
        doc.text('Discounts:', totalsStartX, currentY);
        doc.text(`-₹${data.discountTotal.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });
        currentY += 18;
      }

      doc.text('Taxes (GST):', totalsStartX, currentY);
      doc.text(`₹${data.taxTotal.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });
      currentY += 18;

      // Grand Total
      doc.rect(totalsStartX - 10, currentY, 225, 26).fill('#F8FAFC');
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('Total Amount:', totalsStartX, currentY + 7);
      doc.text(`₹${data.totalAmount.toFixed(2)}`, 460, currentY + 7, { width: 85, align: 'right' });
      currentY += 32;

      // Payment details if partially or fully paid
      if (data.amountPaid > 0) {
        doc.fontSize(9).font('Helvetica').fillColor('#16A34A');
        doc.text('Amount Paid:', totalsStartX, currentY);
        doc.text(`₹${data.amountPaid.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });
        currentY += 18;

        doc.font('Helvetica-Bold').fillColor(data.balanceDue > 0 ? '#DC2626' : '#16A34A');
        doc.text('Balance Due:', totalsStartX, currentY);
        doc.text(`₹${data.balanceDue.toFixed(2)}`, 460, currentY, { width: 85, align: 'right' });
        currentY += 24;
      }

      // Notes
      if (data.notes) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('Notes / Instructions:', 40, currentY);
        doc.font('Helvetica').fillColor(mutedColor).text(data.notes, 40, currentY + 14, { width: 450 });
      }

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#94A3B8')
        .text('Thank you for choosing Brightloop Software! LOOPFLOW Automated Billing System.', 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
