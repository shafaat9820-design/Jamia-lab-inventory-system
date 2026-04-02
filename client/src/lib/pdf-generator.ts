
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { User, InventoryItem, Report } from '@shared/schema';

// Helper to format currency
const formatCurrency = (val: string | number) => 
  `INR ${Number(val).toLocaleString('en-IN')}`;

export const downloadEquipmentReport = (
  report: Report, 
  equipment: InventoryItem, 
  user: User | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'a4'
  });

  // Settings
  const margin = 0.5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  // 1. Draw Border
  doc.setLineWidth(0.01);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  // 2. Margins for text (content starts 0.5in from border? User said "margin 0.5 inch in border and text")
  // I will assume the border is at 0.5in and text starts slightly inside it, or text is at 0.5in.
  // "margin 0.5 inch in border and text" -> I'll place the border at 0.5 and the text at 0.75 or similar to be safe,
  // or just use 0.75 for text.
  const textX = margin + 0.25;
  let currentY = margin + 0.5;

  // 3. Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text("JAMIA MILLIA ISLAMIA", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.25;
  doc.setFontSize(12);
  doc.text("Department of Computer Engineering, University Polytechnic", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.4;

  // 4. Report Title
  doc.setFontSize(14);
  doc.text("TECHNICAL INSPECTION REPORT", pageWidth / 2, currentY, { align: 'center' });
  doc.setLineWidth(0.015);
  doc.line(pageWidth / 2 - 1.5, currentY + 0.05, pageWidth / 2 + 1.5, currentY + 0.05);
  currentY += 0.6;

  // 5. Equipment Details (Bold labels)
  doc.setFontSize(12);
  const leftCol = textX;
  const rightCol = textX + 2.5;

  const drawRow = (label: string, value: string) => {
    doc.setFont('times', 'bold');
    doc.text(label, leftCol, currentY);
    doc.setFont('times', 'normal');
    doc.text(`: ${value}`, rightCol, currentY);
    currentY += 0.3;
  };

  drawRow("Equipment Name", equipment.name);
  drawRow("Asset Code", equipment.itemCode);
  drawRow("Laboratory", equipment.labName);
  drawRow("Purchase Date", new Date(equipment.purchaseDate).toLocaleDateString('en-IN'));
  drawRow("Original Cost", formatCurrency(equipment.originalCost));
  currentY += 0.2;

  // 6. Inspection Details
  doc.setFont('times', 'bold');
  doc.text("INSPECTION FINDINGS", textX, currentY);
  currentY += 0.25;
  
  doc.setFont('times', 'normal');
  const dateStr = new Date(report.date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Inspection Date: ${dateStr}`, textX, currentY);
  currentY += 0.25;

  doc.text(`Functional Status: ${report.functionalStatus}`, textX, currentY);
  currentY += 0.25;

  doc.setFont('times', 'bold');
  doc.text(`Recommendation: ${report.recommendation}`, textX, currentY);
  currentY += 0.4;

  // 7. Technical Notes
  doc.setFont('times', 'bold');
  doc.text("TECHNICAL NOTES / OBSERVATIONS:", textX, currentY);
  currentY += 0.25;
  doc.setFont('times', 'normal');
  const notes = report.notes || "No additional technical notes provided.";
  const splitNotes = doc.splitTextToSize(notes, contentWidth - 0.5);
  doc.text(splitNotes, textX, currentY);
  currentY += (splitNotes.length * 0.2) + 0.5;

  // 8. Signature Area
  if (currentY > pageHeight - 2) {
    doc.addPage();
    currentY = margin + 1;
    doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
  }

  currentY = pageHeight - 1.5;
  doc.line(textX, currentY, textX + 2, currentY);
  doc.line(pageWidth - textX - 2, currentY, pageWidth - textX, currentY);
  
  currentY += 0.2;
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.text("Technical Staff / In-Charge", textX + 1, currentY, { align: 'center' });
  doc.text("Head of Department", pageWidth - textX - 1, currentY, { align: 'center' });

  // 9. Footer
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.text(`Report Generated On: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 0.6, { align: 'center' });

  // Download
  doc.save(`Report_${equipment.itemCode}_${new Date().getTime()}.pdf`);
};
