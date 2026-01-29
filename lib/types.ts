
export enum ItemGroup {
    PAPER = 'PAPER',
    REEL = 'REEL',
    FILM = 'FILM',
    INK = 'INK',
    OTHER = 'OTHER'
}

export enum Unit {
    KG = 'KG',
    SHEET = 'SHEET',
    METER = 'METER',
    PCS = 'PCS',
    LITRE = 'LITRE',
    ROLL = 'ROLL',
    EACH = 'EACH'
}

export interface MaterialItem {
    id: string;
    code: string;
    name: string;
    group: ItemGroup;
    stockUnit: Unit;
    gsm?: number;
    width?: number; // mm
    density?: number;
    thickness?: number; // micron
    wtPerPacking?: number;
}

export interface Job {
    id: string;
    jobNo: string;
    clientName: string;
    machine: string;
    operator: string;
    targetQty: number;
    materials: MaterialItem[];
}

export interface ScrapEntry {
    id: string;
    date: string;
    itemId: string;
    jobId?: string; // Optional if manual
    source: 'PRODUCTION' | 'MANUAL';
    inputQty: number;
    inputUnit: Unit;
    convertedWeightKg: number;
    reason?: string;

    // Specific params for formula
    params: {
        width?: number;
        length?: number;
        sheets?: number;
        runningLength?: number;
        thickness?: number;
        density?: number;
        wtPerPacking?: number; // Weight per piece in KG for PCS unit
        numberOfPcs?: number; // Number of pieces for PCS unit
    }
}

export interface ScrapStockItem {
    item: MaterialItem;
    qty: number;
    lastUpdated: string;
}

export interface InvoiceItem {
    scrapStockId: string;
    qtyToSell: number;
    rate: number;
}

// --- Auth Types ---
export interface Company {
    id: string;
    name: string;
    code: string;
    logo?: string;
}

export interface User {
    id: string;
    username: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
    email: string;
    companyId: string;
}
