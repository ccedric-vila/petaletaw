async function generatePdfReceipt(order, filePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(18).text('Order Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: ${order.id}`);
        doc.text(`Customer Name: ${order.name}`);
        doc.text(`Order Date: ${order.created_at}`);
        doc.text(`Status: Delivered`);
        doc.text('Thank you for shopping with us!');

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
