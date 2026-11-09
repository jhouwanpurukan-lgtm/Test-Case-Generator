import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadPDF(rows, title = 'Test Cases') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(15, 22, 64);
  doc.rect(0, 0, 297, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title, 14, 13);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 220, 13);

  const columns = [
    { header: 'Test Case ID', dataKey: 'Test Case ID' },
    { header: 'Feature', dataKey: 'Feature' },
    { header: 'Title', dataKey: 'Title' },
    { header: 'Test Type', dataKey: 'Test Type' },
    { header: 'Priority', dataKey: 'Priority' },
    { header: 'Expected Result', dataKey: 'Expected Result' },
    { header: 'Status', dataKey: 'Execution Status' },
  ];

  autoTable(doc, {
    startY: 24,
    columns,
    body: rows,
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 42, 110], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { cellWidth: 70 },
      6: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Page ${i} of ${totalPages}`, 260, 200);
  }

  doc.save('test_cases.pdf');
}
