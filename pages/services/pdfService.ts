import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BrandDNA } from '../types';

export const exportBrandProfileToPDF = async (elementId: string, dna: BrandDNA) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // 1. Capture the DOM element as a canvas
    // We add some scaling to ensure high quality
    const canvas = await html2canvas(element, {
      scale: 2, // Retine quality
      useCORS: true, // Allow loading cross-origin images (like cached Gemini images)
      logging: false,
      backgroundColor: '#ffffff' // Ensure white background for PDF
    });

    const imgData = canvas.toDataURL('image/png');

    // 2. Initialize PDF (A4 size standard)
    // p = portrait, mm = millimeters, a4 = format
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // 3. Handle multi-page splitting
    // If the content is taller than one page, add pages
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // 4. Save
    const filename = `${dna.name.replace(/\s+/g, '_')}_Brand_DNA.pdf`;
    pdf.save(filename);

  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Failed to export PDF. Ensure all images are loaded.");
  }
};