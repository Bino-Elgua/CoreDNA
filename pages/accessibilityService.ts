import { BrandColor } from "../types";

interface ContrastResult {
  color1: BrandColor;
  color2: BrandColor;
  ratio: number;
  score: 'AAA' | 'AA' | 'Fail';
}

function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;

  const [lr, lg, lb] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function calculateContrast(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export const analyzeAccessibility = (colors: BrandColor[]): ContrastResult[] => {
  const results: ContrastResult[] = [];
  
  // Compare every color against every other color
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const c1 = colors[i];
      const c2 = colors[j];
      
      // Simple validation for hex
      if (!c1.hex.startsWith('#') || !c2.hex.startsWith('#')) continue;

      const ratio = calculateContrast(c1.hex, c2.hex);
      let score: 'AAA' | 'AA' | 'Fail' = 'Fail';
      
      if (ratio >= 7) score = 'AAA';
      else if (ratio >= 4.5) score = 'AA';

      // Only return useful combinations (passing or high visibility) or if user wants full matrix
      // For this UI, we return everything sorted by ratio
      results.push({ color1: c1, color2: c2, ratio, score });
    }
  }

  return results.sort((a, b) => b.ratio - a.ratio);
};