/**
 * Production Unit Helper Functions
 * Provides utilities for managing production unit selection across the application
 */

/**
 * Get the currently selected production unit ID from session storage
 * @returns The selected production unit ID as a string, or null if not set
 */
export function getSelectedProductionUnitId(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('selectedProductionUnitId');
}

/**
 * Get the currently selected production unit name from session storage
 * @returns The selected production unit name as a string, or null if not set
 */
export function getSelectedProductionUnitName(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('selectedProductionUnitName');
}

/**
 * Set the selected production unit in session storage
 * @param unitId - The production unit ID to set
 * @param unitName - The production unit name to set
 */
export function setSelectedProductionUnit(unitId: string, unitName: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('selectedProductionUnitId', unitId);
    sessionStorage.setItem('selectedProductionUnitName', unitName);
}

/**
 * Clear the selected production unit from session storage
 */
export function clearSelectedProductionUnit(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('selectedProductionUnitId');
    sessionStorage.removeItem('selectedProductionUnitName');
}

/**
 * Check if a production unit is currently selected
 * @returns true if a production unit is selected, false otherwise
 */
export function hasSelectedProductionUnit(): boolean {
    return getSelectedProductionUnitId() !== null;
}
