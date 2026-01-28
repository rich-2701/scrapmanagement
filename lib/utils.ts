import { ItemGroup, Unit } from './types';

// Calculation Logic based on Prompt formulas
export const calculateScrapWeight = (
  group: ItemGroup,
  params: {
    width?: number;
    length?: number; 
    sheets?: number;
    runningLength?: number;
    thickness?: number;
    density?: number;
    gsm?: number;
    qty?: number; 
    unit?: Unit;
  }
): number => {
  const { width = 0, length = 0, sheets = 0, runningLength = 0, thickness = 0, density = 0, gsm = 0, qty = 0, unit } = params;

  // Direct KG entry
  if (unit === Unit.KG) {
    return qty;
  }

  switch (group) {
    case ItemGroup.PAPER:
      // Formula: KG = (Width × Length × GSM × Sheets) / 1550 / 1,000,000
      // Assumption: Width/Length in mm
      if (width && length && gsm && sheets) {
        return (width * length * gsm * sheets) / 1550 / 1000000;
      }
      break;

    case ItemGroup.REEL:
      // Formula: KG = (Width × GSM × RunningLength) / 1550
      // Assumption: Width in mm? The divisor 1550 suggests a specific industry constant.
      if (width && gsm && runningLength) {
        return (width * gsm * runningLength) / 1550;
      }
      break;

    case ItemGroup.FILM:
      // Formula: KG = (Width/25.4 × Length × Density × Thickness) / 1000
      // Width usually in mm, converted to inches by /25.4?
      // Length here is Running Length
      const len = runningLength || length;
      if (width && len && density && thickness) {
        return ((width / 25.4) * len * density * thickness) / 1000;
      }
      break;

    case ItemGroup.INK:
      // Usually entered in Litre or KG directly.
      // If Litre, we might need density, but for now assuming 1:1 or direct KG entry usually.
      if (unit === Unit.LITRE) {
        // Simple mock conversion if needed, or return raw
        return qty;
      }
      break;

    default:
      return qty;
  }

  return 0;
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(num);
};

export const getFormulaDescription = (group: ItemGroup): string => {
  switch(group) {
    case ItemGroup.PAPER:
      return "KG = (Width × Length × GSM × Sheets) / 1550 / 1,000,000";
    case ItemGroup.REEL:
      return "KG = (Width × GSM × RunningLength) / 1550";
    case ItemGroup.FILM:
      return "KG = (Width/25.4 × Length × Density × Thickness) / 1000";
    default:
      return "Direct Weight Entry";
  }
}
