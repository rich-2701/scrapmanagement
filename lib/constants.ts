import { Job, ItemGroup, Unit, MaterialItem, ScrapStockItem } from './types';
import { LayoutDashboard, Package, PlusSquare, ShoppingCart, BookOpen, FileText } from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entry', label: 'Scrap Entry', icon: PlusSquare },
  { id: 'stock', label: 'Scrap Stock', icon: Package },
  { id: 'sales', label: 'Scrap Sales', icon: ShoppingCart },
  { id: 'processed', label: 'Show Processed', icon: FileText },
  { id: 'ledger', label: 'Scrap Ledger', icon: BookOpen },
];

export const MOCK_ITEMS: MaterialItem[] = [
  { id: 'm1', code: 'PAP-001', name: 'Art Paper 170GSM', group: ItemGroup.PAPER, stockUnit: Unit.SHEET, gsm: 170, width: 700 },
  { id: 'm2', code: 'REL-002', name: 'Kraft Reel 120GSM', group: ItemGroup.REEL, stockUnit: Unit.ROLL, gsm: 120, width: 1000 },
  { id: 'm3', code: 'FLM-003', name: 'BOPP Film 12mic', group: ItemGroup.FILM, stockUnit: Unit.METER, density: 0.91, thickness: 12 },
  { id: 'm4', code: 'INK-004', name: 'Cyan Offset Ink', group: ItemGroup.INK, stockUnit: Unit.KG },
  { id: 'm5', code: 'PAP-005', name: 'Duplex Board 300GSM', group: ItemGroup.PAPER, stockUnit: Unit.SHEET, gsm: 300, width: 900 },
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'j1', jobNo: 'JOB-2024-001', clientName: 'Nestle Foods', machine: 'Heidelberg XL', operator: 'John Doe', targetQty: 50000,
    materials: [MOCK_ITEMS[0], MOCK_ITEMS[3]]
  },
  {
    id: 'j2', jobNo: 'JOB-2024-002', clientName: 'Samsung Electronics', machine: 'Komori Lithrone', operator: 'Jane Smith', targetQty: 12000,
    materials: [MOCK_ITEMS[2], MOCK_ITEMS[1]]
  },
  {
    id: 'j3', jobNo: 'JOB-2024-003', clientName: 'Local Pharma', machine: 'Bobst Die Cutter', operator: 'Mike Ross', targetQty: 100000,
    materials: [MOCK_ITEMS[4]]
  }
];

export const MOCK_STOCK: ScrapStockItem[] = [
  { item: MOCK_ITEMS[0], qty: 450.5, lastUpdated: '2024-05-10' },
  { item: MOCK_ITEMS[1], qty: 1200.0, lastUpdated: '2024-05-11' },
  { item: MOCK_ITEMS[2], qty: 85.2, lastUpdated: '2024-05-09' },
  { item: MOCK_ITEMS[4], qty: 320.1, lastUpdated: '2024-05-12' },
];

export const SCRAP_REASONS = [
  'Machine Setup Waste',
  'Color Mismatch',
  'Registration Error',
  'Damaged Raw Material',
  'Trimming Waste',
  'Used',
  'Other'
];
