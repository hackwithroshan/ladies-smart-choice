
const PDFDocument = require('pdfkit');

function generateInvoice(order, storeDetails = {}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        // --- INVOICE DESIGN ---

        const brandColor = '#E11D48';
        const lightGray = '#f3f4f6';
        const darkGray = '#374151';
        const lightText = '#6b7280';

        // Header
        doc.fontSize(24).font('Helvetica-Bold').fillColor(darkGray).text('INVOICE', { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor(lightText).text(`Order ID: #${order.id.substring(0, 8).toUpperCase()}`);
        doc.text(`Invoice Date: ${new Date(order.date).toLocaleDateString()}`);

        // Company Info (right aligned) - Now uses dynamic storeDetails
        const companyX = 350;
        doc.fontSize(12).font('Helvetica-Bold').fillColor(darkGray).text(storeDetails.storeName || 'Ladies Smart Choice', companyX, 50, { align: 'right' });
        doc.fontSize(10).font('Helvetica').fillColor(lightText).text(storeDetails.address || '123 Fashion Ave, Mumbai, 400001', companyX, 68, { align: 'right' });
        doc.text(storeDetails.contactEmail || 'support@ladiessmartchoice.com', companyX, 83, { align: 'right' });
        doc.text(storeDetails.contactPhone || '+91 987 654 3210', companyX, 98, { align: 'right' });
        
        doc.moveDown(4);

        // Bill To & Ship To
        const infoY = doc.y;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(lightText).text('BILL TO', { continued: true });
        doc.font('Helvetica');
        doc.fontSize(10).fillColor(darkGray).text(order.customerName);
        doc.fillColor(lightText).text(order.shippingAddress.address);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`);
        doc.text(order.customerEmail);
        doc.text(order.customerPhone);

        doc.moveDown(3);

        // Table Header
        const tableTop = doc.y;
        doc.rect(doc.x, tableTop, 515, 25).fill(lightGray);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(darkGray);
        doc.text('ITEM', 50, tableTop + 8);
        doc.text('QTY', 300, tableTop + 8, { width: 90, align: 'right' });
        doc.text('UNIT PRICE', 370, tableTop + 8, { width: 90, align: 'right' });
        doc.text('TOTAL', 0, tableTop + 8, { align: 'right' });

        // Table Rows
        let y = tableTop + 35;
        doc.font('Helvetica').fontSize(10).fillColor(darkGray);
        order.items.forEach(item => {
            doc.text(item.name, 50, y, { width: 240 });
            doc.text(item.quantity.toString(), 300, y, { width: 90, align: 'right' });
            doc.text(`₹${item.price.toFixed(2)}`, 370, y, { width: 90, align: 'right' });
            doc.fillColor(brandColor).font('Helvetica-Bold').text(`₹${(item.price * item.quantity).toFixed(2)}`, 0, y, { align: 'right' });
            
            y += doc.heightOfString(item.name, { width: 240 }) + 10;
            doc.moveTo(50, y-5).lineTo(555, y-5).strokeColor(lightGray).stroke();
            y += 5;
            doc.fillColor(darkGray).font('Helvetica'); // Reset colors for next item
        });
        
        // Totals
        y = Math.max(y, 400); // Ensure totals start at a consistent position
        const totalsX = 350;
        doc.font('Helvetica').fontSize(10).fillColor(lightText);
        doc.text('Subtotal:', totalsX, y, { width: 120, align: 'right' });
        doc.text(`₹${order.total.toFixed(2)}`, 0, y, { align: 'right' });
        y += 20;
        doc.text('Shipping:', totalsX, y, { width: 120, align: 'right' });
        doc.text('₹0.00', 0, y, { align: 'right' });
        y += 20;
        doc.moveTo(totalsX, y).lineTo(555, y).strokeColor(darkGray).stroke();
        y += 10;
        doc.font('Helvetica-Bold').fontSize(14).fillColor(darkGray).text('TOTAL', totalsX, y, { width: 120, align: 'right' });
        doc.text(`₹${order.total.toFixed(2)}`, 0, y, { align: 'right' });

        // Footer
        doc.fontSize(9).font('Helvetica').fillColor(lightText).text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

        doc.end();
    });
}

module.exports = { generateInvoice };
