'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronUp, Sun, Moon, Building2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NAV_ITEMS } from '@/lib/constants';
import { authApi } from '@/lib/api';

interface LayoutProps {
    children: React.ReactNode;
    activePage: string;
    headerAction?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, headerAction }) => {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [productionUnits, setProductionUnits] = useState<any[]>([]);
    const [selectedProductionUnit, setSelectedProductionUnit] = useState<string>('');
    const [isProductionUnitMenuOpen, setIsProductionUnitMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const productionUnitMenuRef = useRef<HTMLDivElement>(null);

    // Load user data from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('scrap_user_data');
            if (userData) {
                setCurrentUser(JSON.parse(userData));
            }
        }
    }, []);

    // Fetch production units
    useEffect(() => {
        const fetchProductionUnits = async () => {
            try {
                const userName = localStorage.getItem('scrap_user_name');

                // Use authApi which automatically handles headers for ValidateScrap
                const result = await authApi.getProductionUnits(userName || undefined);

                if (result.success && result.data) {
                    setProductionUnits(result.data as any[]);

                    // Load selected production unit from local storage first (persistent)
                    const savedUnit = localStorage.getItem('selectedProductionUnitId');
                    if (savedUnit) {
                        setSelectedProductionUnit(savedUnit);
                    } else if ((result.data as any[]).length > 0) {
                        // Use user's assigned production unit from login as default
                        const userAssignedUnitId = localStorage.getItem('scrap_production_unit_id');
                        const units = result.data as any[];

                        let defaultUnitId = units[0].productionUnitId.toString();
                        let defaultUnitName = units[0].productionUnitName;

                        // Check if user's assigned unit exists in the list
                        if (userAssignedUnitId) {
                            const userUnit = units.find((u: any) => u.productionUnitId.toString() === userAssignedUnitId);
                            if (userUnit) {
                                defaultUnitId = userUnit.productionUnitId.toString();
                                defaultUnitName = userUnit.productionUnitName;
                            }
                        }

                        setSelectedProductionUnit(defaultUnitId);
                        localStorage.setItem('selectedProductionUnitId', defaultUnitId);
                        localStorage.setItem('selectedProductionUnitName', defaultUnitName);
                    }
                }
            } catch (error) {
                console.error('Error fetching production units:', error);
            }
        };

        if (currentUser) {
            fetchProductionUnits();
        }
    }, [currentUser]);

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (productionUnitMenuRef.current && !productionUnitMenuRef.current.contains(event.target as Node)) {
                setIsProductionUnitMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleProductionUnitChange = async (unitId: string, unitName: string) => {
        try {
            setSelectedProductionUnit(unitId);
            localStorage.setItem('selectedProductionUnitId', unitId);
            localStorage.setItem('selectedProductionUnitName', unitName);
            // Update localStorage as well so ApiClient picks it up (it prioritizes localStorage)
            localStorage.setItem('scrap_production_unit_id', unitId);
            setIsProductionUnitMenuOpen(false);

            // Update production unit in backend session via authApi
            await authApi.setProductionUnit(unitId);

            // Reload the page to reflect the new production unit selection
            window.location.reload();
        } catch (error) {
            console.error('Error updating production unit:', error);
            // Still reload even if API call fails, as we have it in session storage
            window.location.reload();
        }
    };

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    const handleLogout = () => {
        // Clear localStorage
        localStorage.removeItem('scrap_company_user');
        localStorage.removeItem('scrap_company_pass');
        localStorage.removeItem('scrap_company_data');
        localStorage.removeItem('scrap_user_name');
        localStorage.removeItem('scrap_user_pass');
        localStorage.removeItem('scrap_user_data');
        localStorage.removeItem('scrap_auth_timestamp');
        localStorage.removeItem('scrap_user_id');
        localStorage.removeItem('scrap_company_id');
        localStorage.removeItem('scrap_production_unit_id');
        localStorage.removeItem('scrap_fyear');

        // Redirect to login
        router.push('/login');
    };

    // Map page IDs to routes
    const pageRoutes: Record<string, string> = {
        'dashboard': '/',
        'entry': '/scrap/entry',
        'stock': '/scrap/stock',
        'sales': '/scrap/sales',
        'processed': '/scrap/processed',
        'ledger': '/scrap/ledger',
        'profile': '/scrap/profile',
    };

    return (
        <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden overflow-y-hidden transition-colors duration-300">
            {/* Sidebar - Desktop Only */}
            <aside className="fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shadow-lg md:shadow-none md:static shrink-0 transition-colors duration-300">
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">Scrap Manager</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1 pl-10">ERP System</p>
                    </div>
                </div>

                <div className="px-4 py-4 flex-1 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Main Menu</p>
                    <nav className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(pageRoutes[item.id] || '/')}
                                    className={`
                    w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
                    ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                  `}
                                >
                                    <Icon
                                        size={18}
                                        className={`mr-3 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                                    />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* User Profile Section with Popup Menu */}
                <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0 relative" ref={userMenuRef}>
                    {/* Popup Menu */}
                    {isUserMenuOpen && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-400 uppercase">My Account</p>
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={() => {
                                        handleNavigation('/scrap/profile');
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center"
                                >
                                    <User size={16} className="mr-2 text-slate-400" />
                                    View Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}

                    <div
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isUserMenuOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                            {currentUser?.Username ? currentUser.Username.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{currentUser?.Username || 'Admin'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.Role || 'User'}</p>
                        </div>
                        <ChevronUp size={16} className={`text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 min-w-0 flex flex-col h-full relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

                {/* Top Bar with Dark Mode Toggle */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-4 shrink-0 z-40 transition-colors duration-300 overflow-visible">
                    <div className="flex items-center min-w-0 flex-shrink">
                        <h1 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {NAV_ITEMS.find(i => i.id === activePage)?.label || 'Scrap Manager'}
                        </h1>
                    </div>


                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        {/* Header Actions (e.g. Filters) injected from page */}
                        {headerAction && <div className="flex items-center flex-shrink-0">{headerAction}</div>}

                        {/* Production Unit Dropdown */}
                        {productionUnits.length > 0 && (
                            <div className="relative" ref={productionUnitMenuRef}>
                                <button
                                    onClick={() => setIsProductionUnitMenuOpen(!isProductionUnitMenuOpen)}
                                    className="flex items-center gap-1 px-1.5 md:px-2 py-1 md:py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                    aria-label="Select Production Unit"
                                >
                                    <Building2 size={14} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
                                    <span className="text-[10px] md:text-xs font-medium truncate max-w-[80px] md:max-w-[100px]">
                                        {productionUnits.find(u => u.productionUnitId.toString() === selectedProductionUnit)?.productionUnitName || 'Select Unit'}
                                    </span>
                                    <ChevronUp size={10} className={`text-slate-400 transition-transform flex-shrink-0 ${isProductionUnitMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isProductionUnitMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Production Units</p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-1">
                                            {productionUnits.map((unit) => (
                                                <button
                                                    key={unit.productionUnitId}
                                                    onClick={() => handleProductionUnitChange(unit.productionUnitId.toString(), unit.productionUnitName)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${selectedProductionUnit === unit.productionUnitId.toString()
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="font-medium">{unit.productionUnitName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{unit.companyName}</div>
                                                    </div>
                                                    {selectedProductionUnit === unit.productionUnitId.toString() && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="relative w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 flex-shrink-0"
                            aria-label="Toggle Theme"
                        >
                            <Sun className="h-3.5 w-3.5 md:h-4 md:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute top-1.5 left-1.5 md:top-2 md:left-2" />
                            <Moon className="h-3.5 w-3.5 md:h-4 md:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute top-1.5 left-1.5 md:top-2 md:left-2" />
                        </button>
                    </div>
                </header>

                {/* Page Content - Full Height, No Padding */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-950 p-0">
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-[80] pb-safe transition-colors duration-300">
                    <div className="flex justify-around items-center h-16">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(pageRoutes[item.id] || '/')}
                                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                                >
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[10px] font-medium">{item.label.split(' ')[1] || item.label}</span>
                                </button>
                            );
                        })}
                        {/* Mobile User Profile Tab */}
                        <button
                            onClick={() => handleNavigation('/scrap/profile')}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activePage === 'profile' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        >
                            <User size={20} strokeWidth={activePage === 'profile' ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">Profile</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
