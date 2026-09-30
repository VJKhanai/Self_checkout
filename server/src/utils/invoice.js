const PDFDocument = require('pdfkit');

/** Streams a PDF invoice straight to the HTTP response. */
function streamInvoice(res, order, brandName) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order._id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text('Self_checkout', { align: 'left' });
  doc.fontSize(10).fillColor('#555').text(`Invoice #${order._id}`);
  doc.text(`Store: ${brandName}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`);
  doc.text(`Payment ID: ${order.gatewayPaymentId || '-'}`);
  doc.moveDown().fillColor('#000');

  doc.fontSize(12).text('Items');
  order.items.forEach((i) => {
    doc
      .fontSize(10)
      .text(`${i.name}${i.size ? ` (${i.size})` : ''}  x${i.qty}`, { continued: true })
      .text(`  Rs ${(i.price * i.qty).toFixed(2)}  (GST ${i.gstPercent}%: Rs ${i.gstAmount.toFixed(2)})`);
  });

  doc.moveDown();
  doc.fontSize(10).text(`Subtotal: Rs ${order.subtotal.toFixed(2)}`);
  doc.text(`GST: Rs ${order.gstTotal.toFixed(2)}`);
  doc.fontSize(13).text(`Total: Rs ${order.total.toFixed(2)}`);
  doc.moveDown().fontSize(9).fillColor('#777').text('Show the exit QR in the app to the guard at the store exit.');
  doc.end();
}

module.exports = { streamInvoice };
