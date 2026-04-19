/**
 * Project: Jamia Lab Inventory Management System
 * Developed by: JMI University Polytechnic Computer Engg 6th Sem Students
 * Team: Shafaat, Farman, Aqdas, Rihan, Farhan
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, InventoryItem, Report } from '@shared/schema';
import jaimaLogo from '@/assets/jamia-logo.png';

// currency formatter
const formatCurrency = (val: string | number) => 
  `Rs. ${Number(val).toLocaleString('en-IN')}`;

export const downloadArticleReport = (
  report: Report, 
  article: InventoryItem, 
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
  doc.text("University Polytechnic", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.4;

  // 4. Report Title
  doc.setFontSize(14);
  doc.text("ARTICLE INSPECTION REPORT", pageWidth / 2, currentY, { align: 'center' });
  doc.setLineWidth(0.015);
  doc.line(pageWidth / 2 - 1.5, currentY + 0.05, pageWidth / 2 + 1.5, currentY + 0.05);
  currentY += 0.6;

  // 5. Article Details (Bold labels)
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

  drawRow("Article Name", article.name);
  drawRow("Asset Code", article.itemCode);
  drawRow("Laboratory", article.labName);
  drawRow("Location", article.location || "—");
  drawRow("Purchase Date", new Date(article.purchaseDate).toLocaleDateString('en-IN'));
  drawRow("Original Cost", formatCurrency(article.originalCost));
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
  doc.save(`Report_${article.itemCode}_${new Date().getTime()}.pdf`);
};

export const downloadDepreciationReport = (
  article: InventoryItem,
  user: User | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'a4'
  });

  const margin = 0.5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  // Border
  doc.setLineWidth(0.01);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  const textX = margin + 0.25;
  let currentY = margin + 0.5;

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text("JAMIA MILLIA ISLAMIA", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.25;
  doc.setFontSize(12);
  doc.text("University Polytechnic", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.4;

  // Report Title
  doc.setFontSize(14);
  doc.text("ARTICLE DEPRECIATION REPORT", pageWidth / 2, currentY, { align: 'center' });
  doc.setLineWidth(0.015);
  doc.line(pageWidth / 2 - 1.5, currentY + 0.05, pageWidth / 2 + 1.5, currentY + 0.05);
  currentY += 0.6;

  // Article Details
  doc.setFontSize(12);
  const leftCol = textX;
  const midCol = textX + 2.5;

  const drawRow = (label: string, value: string) => {
    doc.setFont('times', 'bold');
    doc.text(label, leftCol, currentY);
    doc.setFont('times', 'normal');
    doc.text(`: ${value}`, midCol, currentY);
    currentY += 0.3;
  };

  drawRow("Article Name", article.name);
  drawRow("Asset Code", article.itemCode);
  drawRow("Laboratory", article.labName);
  drawRow("Location", article.location || "—");
  drawRow("Quantity (Qty)", (article.quantity || 1).toString());
  drawRow("Purchase Date", new Date(article.purchaseDate).toLocaleDateString('en-IN'));
  drawRow("Unit Cost", formatCurrency(Number(article.originalCost)));
  drawRow("Depreciation Rate", `${article.depreciationRate}% per annum`);
  currentY += 0.2;

  // Calculation Table
  const purchaseYear = new Date(article.purchaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsElapsed = Math.max(0, currentYear - purchaseYear);
  const qty = article.quantity || 1;
  const rate = Number(article.depreciationRate) / 100;
  const unitCost = Number(article.originalCost);
  const totalCost = unitCost * qty;
  const unitCurrentValue = unitCost * Math.pow(1 - rate, yearsElapsed);
  const totalCurrentValue = unitCurrentValue * qty;

  doc.setFont('times', 'bold');
  doc.text("DEPRECIATION CALCULATION", textX, currentY);
  currentY += 0.3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: textX, right: textX },
    head: [['Yearly Basis', 'Qty', 'Unit Cost', 'Total Cost', 'Total Asset Value (WDV)']],
    body: [[
      `${purchaseYear} (${yearsElapsed} Yrs)`,
      qty.toString(),
      formatCurrency(unitCost),
      formatCurrency(totalCost),
      formatCurrency(totalCurrentValue.toFixed(2))
    ]],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { font: 'times', fontSize: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 0.5;

  // Status and Recommendation
  const valueRatio = totalCost > 0 ? (totalCurrentValue / totalCost) : 1;
  let calculatedStatus = "Active";
  let recommendation = "The article is currently within its useful life and remains operational.";
  
  if (valueRatio < 0.1) {
    calculatedStatus = "Recommend Condemnation";
    recommendation = "The article has reached its salvage value. It is highly recommended to initiate the condemnation process.";
  } else if (valueRatio < 0.3) {
    calculatedStatus = "Old";
    recommendation = "The article is near its salvage value. Consider replacement planning in the next budget cycle.";
  } else if (article.functionalStatus === "Non Working") {
    recommendation = "Article is non-functional. Technical inspection required for repair or condemnation.";
  }

  doc.setFont('times', 'bold');
  doc.text(`Asset Status: ${calculatedStatus}`, textX, currentY);
  currentY += 0.3;

  doc.text("RECOMMENDATION / STATUS:", textX, currentY);
  currentY += 0.3;
  doc.setFont('times', 'normal');
  
  const splitRec = doc.splitTextToSize(recommendation, contentWidth - 0.5);
  doc.text(splitRec, textX, currentY);
  currentY += 0.8;

  // Signatures
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
  doc.text("Store Keeper / Lab In-Charge", textX + 1, currentY, { align: 'center' });
  doc.text("Principal / Head of Office", pageWidth - textX - 1, currentY, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.text(`Depreciation Report Generated On: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 0.6, { align: 'center' });

  doc.save(`Depreciation_Report_${article.itemCode}.pdf`);
};

export const downloadInventoryItemReport = (
  article: InventoryItem,
  user: User | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'a4'
  });

  const margin = 0.5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  // Border
  doc.setLineWidth(0.01);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  const textX = margin + 0.25;
  let currentY = margin + 0.5;

  // Header
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text("JAMIA MILLIA ISLAMIA", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.25;
  doc.setFontSize(12);
  doc.text("University Polytechnic", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.4;

  // Report Title
  doc.setFontSize(14);
  doc.text("ARTICLE INVENTORY RECORD", pageWidth / 2, currentY, { align: 'center' });
  doc.setLineWidth(0.015);
  doc.line(pageWidth / 2 - 1.5, currentY + 0.05, pageWidth / 2 + 1.5, currentY + 0.05);
  currentY += 0.6;

  // Article Details
  doc.setFontSize(12);
  const leftCol = textX;
  const midCol = textX + 2.5;

  const drawRow = (label: string, value: string) => {
    doc.setFont('times', 'bold');
    doc.text(label, leftCol, currentY);
    doc.setFont('times', 'normal');
    doc.text(`: ${value}`, midCol, currentY);
    currentY += 0.3;
  };

  drawRow("Article Name", article.name);
  drawRow("Asset Code", article.itemCode);
  drawRow("Category", article.category);
  drawRow("Laboratory", article.labName);
  drawRow("Location", article.location || "—");
  drawRow("Budget Category", article.budget || "—");
  if (article.gemOrderId) {
    drawRow("GeM Order ID", article.gemOrderId);
  }
  if (article.gemOrderDate) {
    drawRow("GeM Order Date", new Date(article.gemOrderDate).toLocaleDateString('en-IN'));
  }
  drawRow("Quantity (Qty)", (article.quantity || 1).toString());
  drawRow("Purchase Date", new Date(article.purchaseDate).toLocaleDateString('en-IN'));
  drawRow("Unit Cost", formatCurrency(Number(article.originalCost)));
  drawRow("Total Cost", formatCurrency(Number(article.originalCost) * (article.quantity || 1)));
  currentY += 0.2;

  // Lifetime & Value
  doc.setFont('times', 'bold');
  doc.text("LIFETIME & VALUATION", textX, currentY);
  currentY += 0.3;

  drawRow("Estimated Useful Life", `${article.usefulLife} Years`);
  drawRow("Depreciation Rate", `${article.depreciationRate}% per annum`);

  // Simple Value calculation
  const purchaseYear = new Date(article.purchaseDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsElapsed = Math.max(0, currentYear - purchaseYear);
  const qty = article.quantity || 1;
  const rate = Number(article.depreciationRate) / 100;
  const unitCost = Number(article.originalCost);
  const unitCurrentValue = unitCost * Math.pow(1 - rate, yearsElapsed);
  const totalCurrentValue = unitCurrentValue * qty;

  drawRow("Current Asset Value (WDV)", formatCurrency(totalCurrentValue.toFixed(2)));
  drawRow("Functional Status", article.functionalStatus);
  drawRow("Current Approval Status", article.approvalStatus);
  
  // Signatures
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
  doc.text("Store Keeper / Lab In-Charge", textX + 1, currentY, { align: 'center' });
  doc.text("Head of Department / Principal", pageWidth - textX - 1, currentY, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.text(`Inventory Record Generated On: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 0.6, { align: 'center' });

  doc.save(`Inventory_Record_${article.itemCode}.pdf`);
};

/**
 * Generates the Institutional Policy PDF (GFR 2017 & Depreciation)
 */
export const downloadPolicyPDF = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'a4'
  });

  const pageWidth = 8.27;
  const pageHeight = 11.69;
  const margin = 0.5;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Background Box
  doc.setDrawColor(13, 51, 24); // Institutional Green
  doc.setLineWidth(0.02);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  // Header
  currentY += 0.5;
  doc.addImage(jaimaLogo, 'PNG', pageWidth / 2 - 0.5, currentY, 1, 1);
  currentY += 1.2;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(13, 51, 24);
  doc.text("JAMIA MILLIA ISLAMIA", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.3;
  doc.setFontSize(12);
  doc.text("OFFICIAL INSTITUTIONAL LAB POLICY (2024 REVISION)", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.5;

  // Section 1: GFR 2017 Rule 196
  doc.setFontSize(14);
  doc.text("SECTION 1: DISPOSAL OF GOODS (GFR 2017 - RULE 196)", margin + 0.2, currentY);
  currentY += 0.25;
  doc.setLineWidth(0.01);
  doc.line(margin + 0.2, currentY, margin + 4, currentY);
  currentY += 0.3;

  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const gfrText = [
    "1. Declaration of surplus, obsolete or unserviceable goods: An item of goods may be declared surplus, obsolete, or unserviceable if, in the opinion of the competent authority, the same is of no further use to the Ministry or Department.",
    "",
    "2. Competent Authority: The authority competent to purchase the item shall also be competent to declare the item as surplus or unserviceable and authorize its disposal.",
    "",
    "3. Disposal Committee: A Survey/Condemnation Committee should be appointed to examine the goods and recommend whether they are fit for further use or should be disposed of.",
    "",
    "4. Modes of Disposal: Surplus or unserviceable goods with an assessed residual value above Rs. 2 Lakh should be disposed of by (a) Advertised Tender or (b) Public Auction."
  ];

  gfrText.forEach(line => {
    const splitLine = doc.splitTextToSize(line, contentWidth - 0.4);
    doc.text(splitLine, margin + 0.2, currentY);
    currentY += splitLine.length * 0.2;
  });

  currentY += 0.4;

  // Section 2: Depreciation Methodology
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(13, 51, 24);
  doc.text("SECTION 2: DEPRECIATION CALCULATION & WDV METHOD", margin + 0.2, currentY);
  currentY += 0.25;
  doc.line(margin + 0.2, currentY, margin + 4, currentY);
  currentY += 0.3;

  doc.setFontSize(11);
  doc.setFont('times', 'italic');
  doc.text("Project Formula: Current Value = Original Cost * (1 - Depreciation Rate / 100) ^ Years", margin + 0.2, currentY);
  currentY += 0.4;

  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  const deprText = [
    "The System utilizes the Written Down Value (WDV) method, also known as the Reducing Balance method. In this method, the depreciation percentage is applied to the book value of the asset at the beginning of each year.",
    "",
    "Key Operational Thresholds:",
    "- ACTIVE: Current Value is > 30% of original cost.",
    "- OLD: Current Value is < 30% but > 10% of original cost.",
    "- RECOMMEND CONDEMNATION: Current Value is < 10% of original cost (Salvage Value threshold).",
    "",
    "Note: Functional status 'Non Working' overrides the calculated status for immediate inspection recommendation."
  ];

  deprText.forEach(line => {
    const splitLine = doc.splitTextToSize(line, contentWidth - 0.4);
    doc.text(splitLine, margin + 0.2, currentY);
    currentY += splitLine.length * 0.2;
  });

  // Footer / Institutional Notice
  currentY = pageHeight - 1.2;
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.setTextColor(13, 51, 24);
  doc.text("ISSUED BY ORDER OF THE COMPETENT AUTHORITY", pageWidth / 2, currentY, { align: 'center' });
  currentY += 0.2;
  doc.setFont('times', 'normal');
  doc.text("University Polytechnic, JMI", pageWidth / 2, currentY, { align: 'center' });
  
  currentY = pageHeight - 0.6;
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  doc.text(`Official Document Generated On: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });

  doc.save("Jamia_Millia_Islamia_Lab_Policy.pdf");
};

/**
 * Generates official Form GFR-17 for disposal reporting.
 */
export const downloadGFR17Report = (
  items: InventoryItem[],
  labName?: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 0.5;

  // 1. Header
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text("Form GFR—17", pageWidth / 2, 0.6, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text("(See Clause — iii of Government of India’s Decision— under Rule 196)", pageWidth / 2, 0.72, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text("Report of Surplus, Obsolete and Unserviceable Stores for Disposal", pageWidth / 2, 0.85, { align: 'center' });

  if (labName) {
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(`Laboratory: ${labName}`, margin, 1.05);
  }

  // 2. Table
  const tableData = items.map((item, index) => {
    const totalCost = Number(item.originalCost) * (item.quantity || 1);
    const unitCost = Number(item.originalCost);
    return [
      (index + 1).toString() + ".",
      `${item.name}\n(${item.itemCode})`,
      item.quantity.toString(),
      item.quantity > 1 
        ? `${formatCurrency(totalCost)}\n(Unit: ${formatCurrency(unitCost)})`
        : formatCurrency(unitCost),
      `${item.functionalStatus}\n(Purchased: ${new Date(item.purchaseDate).getFullYear()})`,
      "", // Mode of Disposal left blank as requested
      "" // Remark left blank as requested
    ];
  });

  autoTable(doc, {
    startY: 1.15,
    margin: { left: margin, right: margin },
    head: [[
      'Item No.', 
      'Particulars of Stores', 
      'Quantity/ Weight', 
      'Book Value/ Original Purchase Price', 
      'Condition and Year of Purchase', 
      'Mode of Disposal (Sale, Public auction or otherwise)', 
      'Remark'
    ]],
    body: tableData,
    theme: 'grid',
    styles: { 
      font: 'times', 
      fontSize: 8, 
      cellPadding: 0.08,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.005,
      valign: 'middle',
      halign: 'center'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.005,
    },
    columnStyles: {
      0: { cellWidth: 0.5, halign: 'center' }, // Item No
      1: { halign: 'center', cellWidth: 1.8 }, // Particulars
      2: { cellWidth: 0.7, halign: 'center' }, // Qty
      3: { cellWidth: 1.3, halign: 'center' }, // Book Value
      4: { cellWidth: 1.2, halign: 'center' }, // Condition
      5: { cellWidth: 1.0, halign: 'center' }, // Mode of Disposal
      6: { cellWidth: 0.8, halign: 'center' }, // Remark
    }
  });

  // 3. Footer - Pin to bottom right
  let finalY = pageHeight - margin - 1.2;
  
  // If the table is so long it overlaps the footer area, add a new page
  if ((doc as any).lastAutoTable.finalY > finalY - 0.5) {
    doc.addPage();
    finalY = pageHeight - margin - 1.2;
  }

  const footerX = pageWidth - margin - 2.8;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text("Signature ...................................................", footerX, finalY);
  doc.text("Designation ................................................", footerX, finalY + 0.3);
  doc.text("Date..........................................................", footerX, finalY + 0.6);

  const filename = labName 
    ? `GFR17_Report_${labName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
    : `GFR17_Report_${items[0]?.itemCode || 'Export'}_${new Date().getTime()}.pdf`;

  doc.save(filename);
};
