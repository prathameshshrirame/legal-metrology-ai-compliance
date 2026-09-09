import jsPDF from 'jspdf';
import { InspectionRecord } from '../types';

/**
 * Converts any image (including SVG data URIs) to a standard JPEG/PNG data URL via canvas
 * so jsPDF can reliably embed it in the generated document.
 */
async function ensureRasterDataUrl(imageUri: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 400;
          canvas.height = img.height || 300;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUri;
    } catch {
      resolve(null);
    }
  });
}

export async function generateInspectionPdf(record: InspectionRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Banner: Navy blue (#0f172a)
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 22, 'F');

  // Tricolor accent line at top of banner (Saffron, White, Green)
  doc.setFillColor(249, 115, 22); // Saffron
  doc.rect(margin, y, contentWidth / 3, 2, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(margin + contentWidth / 3, y, contentWidth / 3, 2, 'F');
  doc.setFillColor(34, 197, 94); // Green
  doc.rect(margin + (contentWidth * 2) / 3, y, contentWidth / 3, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LEGAL METROLOGY AI COMPLIANCE INSPECTOR', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Preliminary Screening Report under Legal Metrology (Packaged Commodities) Rules, 2011',
    margin + 6,
    y + 16
  );

  y += 26;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  doc.text('INSPECTION ID:', margin + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(record.id, margin + 35, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE & TIME:', margin + 75, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(record.timestamp).toLocaleString(), margin + 102, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCT:', margin + 6, y + 15);
  doc.setFont('helvetica', 'normal');
  const cleanProdName = record.productName.length > 35 ? record.productName.substring(0, 35) + '...' : record.productName;
  doc.text(cleanProdName, margin + 35, y + 15);

  // Status Badge in Meta card
  const isPass = record.overallStatus === 'PASS';
  if (isPass) {
    doc.setFillColor(220, 252, 231); // light green
    doc.setDrawColor(34, 197, 94);
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setFillColor(254, 242, 242); // light red
    doc.setDrawColor(239, 68, 68);
    doc.setTextColor(153, 27, 27);
  }
  doc.roundedRect(pageWidth - margin - 52, y + 4, 46, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(record.overallStatus, pageWidth - margin - 29, y + 10, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`Score: ${record.complianceScore}/100`, pageWidth - margin - 29, y + 15, { align: 'center' });

  y += 28;

  // Split section: Left is Evidence Image, Right is Core Declarations
  const leftWidth = 55;
  const rightWidth = contentWidth - leftWidth - 6;

  // Left: Evidence Photo Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, leftWidth, 52, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PHYSICAL EVIDENCE', margin + 4, y + 6);

  try {
    const rasterUrl = await ensureRasterDataUrl(record.imageUri);
    if (rasterUrl) {
      doc.addImage(rasterUrl, 'JPEG', margin + 3, y + 9, leftWidth - 6, 40);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text('[Image attached to file]', margin + leftWidth / 2, y + 26, { align: 'center' });
    }
  } catch {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('[Image attached to file]', margin + leftWidth / 2, y + 26, { align: 'center' });
  }

  // Right: Detected Declarations
  const rightX = margin + leftWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, rightWidth, 52, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DETECTED STATUTORY DECLARATIONS', rightX + 4, y + 6);

  const declItems = [
    { label: 'MRP (Rule 6.1.e):', val: record.declarations.mrp || 'Not detected' },
    { label: 'Net Quantity (Rule 6.1.c):', val: record.declarations.netQuantity || 'Not detected' },
    { label: 'Mfg/Packing Date:', val: record.declarations.manufacturingDate || 'Not detected' },
    { label: 'Manufacturer/Packer:', val: record.declarations.manufacturer || record.declarations.packer || 'Not detected' },
    { label: 'Consumer Care:', val: record.declarations.consumerCare || 'Not detected' },
    { label: 'Country of Origin:', val: record.declarations.countryOfOrigin || 'Not detected' },
  ];

  let declY = y + 12;
  doc.setFontSize(7.5);
  declItems.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, rightX + 4, declY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(item.val === 'Not detected' ? 185 : 15, item.val === 'Not detected' ? 28 : 23, item.val === 'Not detected' ? 28 : 42);
    const shortVal = item.val.length > 40 ? item.val.substring(0, 40) + '...' : item.val;
    doc.text(shortVal, rightX + 42, declY);
    declY += 6.5;
  });

  y += 56;

  // Compliance Screening Checks Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY COMPLIANCE SCREENING CHECKS', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('RULE REF', margin + 4, y + 4.8);
  doc.text('CHECK NAME', margin + 28, y + 4.8);
  doc.text('STATUS', margin + 85, y + 4.8);
  doc.text('DETECTED VALUE & REASON', margin + 112, y + 4.8);

  y += 7;

  // Table rows
  for (const chk of record.complianceChecks) {
    const isChkPass = chk.status === 'PASS';
    doc.setFillColor(isChkPass ? 255 : 254, isChkPass ? 255 : 242, isChkPass ? 255 : 242);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 11, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(chk.ruleRef, margin + 4, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.text(chk.checkName, margin + 28, y + 6);

    // Status pill
    if (isChkPass) {
      doc.setFillColor(220, 252, 231);
      doc.setTextColor(22, 101, 52);
    } else {
      doc.setFillColor(254, 226, 226);
      doc.setTextColor(185, 28, 28);
    }
    doc.roundedRect(margin + 83, y + 2, 22, 6.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text(chk.status, margin + 94, y + 6.3, { align: 'center' });

    // Explanation / Detected value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    const line1 = chk.detectedValue.length > 55 ? chk.detectedValue.substring(0, 55) + '...' : chk.detectedValue;
    const line2 = chk.explanation.length > 60 ? chk.explanation.substring(0, 60) + '...' : chk.explanation;
    doc.text(`Val: ${line1}`, margin + 110, y + 4.5);
    doc.text(`Note: ${line2}`, margin + 110, y + 8.5);

    y += 11;
  }

  y += 4;

  // Issues Requiring Review (if any)
  if (record.issuesRequiringReview && record.issuesRequiringReview.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    const boxHeight = 8 + record.issuesRequiringReview.length * 5;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text('POTENTIAL NON-COMPLIANCES / ISSUES REQUIRING REVIEW:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    record.issuesRequiringReview.forEach((issue, idx) => {
      doc.text(`• ${issue}`, margin + 6, y + 10 + idx * 5);
    });

    y += boxHeight + 4;
  }

  // Factual Product Information (Ingredients/Nutrition)
  if (record.declarations.ingredients || record.declarations.nutritionInfo) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('PRODUCT INFORMATION (LABEL-DERIVED FACTUAL DISCLOSURES):', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    if (record.declarations.ingredients && record.declarations.ingredients.length > 0) {
      const ingStr = record.declarations.ingredients.join(', ');
      doc.text(
        `Ingredients: ${ingStr.length > 90 ? ingStr.substring(0, 90) + '...' : ingStr}`,
        margin + 4,
        y + 10
      );
    }

    if (record.declarations.nutritionInfo) {
      const nutEntries = Object.entries(record.declarations.nutritionInfo)
        .slice(0, 4)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      doc.text(`Nutrition Sample: ${nutEntries}`, margin + 4, y + 15);
    }

    y += 22;
  }

  // Mandatory Statutory Legal Disclaimer
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('STATUTORY LEGAL NOTICE & DISCLAIMER', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const disclaimerText =
    'This inspection report is an AI-assisted preliminary compliance screening generated pursuant to the Legal Metrology (Packaged Commodities) Rules, 2011. This document DOES NOT constitute legal certification, official approval, or final adjudication. Potential non-compliances flagged as "Review Required" serve as screening alerts for designated field officers. The final legal authority and decision remains solely with the authorized Legal Metrology Inspector or Enforcement Officer.';
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 8);
  doc.text(splitDisclaimer, margin + 4, y + 9);

  // Bottom footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Smart India Hackathon 2026 (SIH 26034) • Generated on ${new Date().toLocaleString()}`,
    margin,
    290
  );
  doc.text(`Page 1 of 1 • System ID: ${record.id}`, pageWidth - margin, 290, { align: 'right' });

  // Save the PDF
  const filename = `Compliance_Report_${record.id}.pdf`;
  doc.save(filename);
}
