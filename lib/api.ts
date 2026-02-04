// API Configuration and Client for Scrap Management System
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.indusanalytics.co.in';


interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(options.headers as Record<string, string>),
            };

            // Company credentials needed for Basic Auth (ValidateScrap requirement)
            // These are for database connection, not user authentication
            if (typeof window !== 'undefined') {
                const companyUser = localStorage.getItem('scrap_company_user');
                const companyPass = localStorage.getItem('scrap_company_pass');

                if (companyUser && companyPass && !headers['Authorization']) {
                    const credentials = btoa(`${companyUser}:${companyPass}`);
                    headers['Authorization'] = `Basic ${credentials}`;
                }

                // Add user info header for session restoration after page refresh
                const userName = localStorage.getItem('scrap_user_name');
                const userId = localStorage.getItem('scrap_user_id');
                const companyId = localStorage.getItem('scrap_company_id');
                // PRIORITIZE sessionStorage 'selectedProductionUnitId' as it reflects the user's immediate choice in the current session
                const productionUnitId = localStorage.getItem('selectedProductionUnitId') || localStorage.getItem('scrap_production_unit_id');

                // Determine Financial Year
                // Check if explicitly stored, otherwise calculate based on current date (April to March cycle)
                let fYear = localStorage.getItem('scrap_fyear');
                if (!fYear) {
                    const date = new Date();
                    const month = date.getMonth() + 1; // 1-12
                    const year = date.getFullYear();
                    const shortYear = year.toString().slice(-2);

                    if (month >= 4) {
                        // April onwards: Current YY - Next YY
                        const nextShortYear = (year + 1).toString().slice(-2);
                        fYear = `${shortYear}-${nextShortYear}`;
                    } else {
                        // Jan to March: Previous YY - Current YY
                        const prevShortYear = (year - 1).toString().slice(-2);
                        fYear = `${prevShortYear}-${shortYear}`;
                    }
                }

                if (userName) {
                    headers['X-User-Name'] = userName;
                }

                // Ensure CompanyID and UserID are always present (ValidateScrap requires them)
                // Use '0' as fallback for initial authentication calls where they are not yet known
                const finalUserId = userId || '0';
                const finalCompanyId = companyId || '0';

                headers['X-User-Id'] = finalUserId;
                headers['UserID'] = finalUserId;

                headers['X-Company-Id'] = finalCompanyId;
                headers['CompanyID'] = finalCompanyId;

                if (productionUnitId) {
                    headers['X-Production-Unit-Id'] = productionUnitId;
                    headers['ProductionUnitID'] = productionUnitId;
                }

                // Additional headers required by ValidateScrap
                headers['DBType'] = 'MSSQL';
                if (fYear) {
                    headers['FYear'] = fYear;
                }
            }

            let response;
            try {
                response = await fetch(`${this.baseUrl}${endpoint}`, {
                    ...options,
                    headers,
                    credentials: 'include', // Important for session-based auth
                });
            } catch (error) {
                console.error('Network Error:', error);
                throw new Error('Unable to connect to the server. Please ensure the backend is running and accessible.');
            }

            // Handle Unauthorized (401) responses globally
            if (response.status === 401) {
                // Avoid infinite redirect loop if already on login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    console.warn('Session expired or unauthorized. Redirecting to login.');
                    // Optional: Clear session?
                    // localStorage.clear(); 
                    window.location.href = '/login';
                    return { success: false, message: 'Unauthorized' };
                }
            }

            // Try to get response text first
            const responseText = await response.text();
            let result: any = {};

            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', responseText);
                throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}`);
            }

            if (!response.ok) {
                // Log full error details for debugging
                console.error('API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    endpoint: endpoint,
                    responseText: responseText,
                    result: result
                });

                // In production, mask critical server errors (5xx) to prevent showing raw entries to users
                if (process.env.NODE_ENV === 'production' && response.status >= 500) {
                    throw new Error('An unexpected error occurred. Please contact the service provider.');
                }

                throw new Error(result.Message || result.message || result.ExceptionMessage || `Request failed with status ${response.status}`);
            }

            // Normalize response format
            // If response has 'success' property, it's already in ApiResponse format
            if ('success' in result) {
                return result;
            }

            // If response has 'Id' (capital I), it's a direct object (user auth response)
            // Wrap it in ApiResponse format
            if ('Id' in result || 'message' in result) {
                return {
                    success: true,
                    data: result,
                    message: result.message || 'Success'
                };
            }

            // Default: return as-is
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// ============================================
// Authentication API
// ============================================

export const authApi = {
    /**
     * Authenticate company credentials
     */
    authenticateCompany: async (companyUser: string, companyPass: string) => {
        // Encode credentials as Basic Auth
        const credentials = btoa(`${companyUser}:${companyPass}`);

        return apiClient.request('/api/scrap/auth/company', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify({}), // Send empty body
        });
    },

    /**
     * Authenticate user credentials (requires company credentials in Basic Auth)
     */
    authenticateUser: async (username: string, password: string, companyUser?: string, companyPass?: string) => {
        const headers: Record<string, string> = {};

        // If company credentials provided, send via Basic Auth
        if (companyUser && companyPass) {
            const credentials = btoa(`${companyUser}:${companyPass}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }

        return apiClient.request('/api/scrap/auth/user', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                Username: username,
                Password: password,
            }),
        });
    },

    /**
     * Validate current session
     */
    validateSession: async () => {
        return apiClient.get('/api/scrap/auth/session');
    },

    /**
   * Logout and clear session
   */
    logout: async () => {
        return apiClient.post('/api/scrap/auth/logout');
    },

    /**
     * Get production units for the logged-in user
     * UserID is automatically sent via headers from localStorage
     */
    getProductionUnits: async () => {
        // Log the UserID being sent for debugging
        if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('scrap_user_id');
            console.log('🔍 Calling getProductionUnits with UserID:', userId);
        }
        return apiClient.get('/api/scrap/auth/production-units');
    },

    /**
     * Set the selected production unit
     */
    setProductionUnit: async (productionUnitId: string) => {
        return apiClient.post('/api/scrap/auth/set-production-unit', { productionUnitId });
    },
};

// ============================================
// Scrap Management APIs
// ============================================

export const scrapApi = {
    // Materials
    getMaterials: async () => {
        return apiClient.get('/api/scrap/materials');
    },

    getMaterialById: async (id: number) => {
        return apiClient.get(`/api/scrap/materials/${id}`);
    },

    getGroups: async () => {
        return apiClient.get('/api/scrap/groups');
    },

    // Entries
    createEntry: async (entryData: any) => {
        return apiClient.post('/api/scrap/entry', entryData);
    },

    getEntries: async (params?: { fromDate?: string; toDate?: string; source?: string }) => {
        const queryString = params
            ? '?' + new URLSearchParams(params as any).toString()
            : '';
        return apiClient.get(`/api/scrap/entries${queryString}`);
    },

    // Stock
    getStock: async (itemGroupId?: number, entryType?: string, page: number = 1, pageSize: number = 12) => {
        const params = new URLSearchParams();
        if (itemGroupId) params.append('itemGroupId', itemGroupId.toString());
        if (entryType) params.append('entryType', entryType);
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return apiClient.get(`/api/scrap/stock${queryString}`);
    },


    getItemStock: async (itemId: number) => {
        return apiClient.get(`/api/scrap/stock/${itemId}`);
    },

    getItemBatchDetails: async (itemId: number) => {
        return apiClient.get(`/api/scrap/itemBatchDetails/${itemId}`);
    },

    createSale: async (data: any) => {
        return apiClient.post('/api/scrap/invoice/create', data);
    },

    getStockSummary: async () => {
        return apiClient.get('/api/scrap/stock/summary');
    },

    // Sales


    getSales: async (params?: { fromDate?: string; toDate?: string }) => {
        const queryString = params
            ? '?' + new URLSearchParams(params as any).toString()
            : '';
        return apiClient.get(`/api/scrap/sales${queryString}`);
    },

    getSaleById: async (id: number) => {
        return apiClient.get(`/api/scrap/sales/${id}`);
    },

    getSoldItems: async () => {
        return apiClient.get('/api/scrap/sold-items');
    },

    // Invoices
    getAllInvoices: async () => {
        return apiClient.get('/api/scrap/invoices');
    },

    getInvoiceById: async (id: number) => {
        return apiClient.get(`/api/scrap/invoice/${id}`);
    },

    updateInvoice: async (id: number, invoiceData: any) => {
        return apiClient.put(`/api/scrap/invoice/${id}`, invoiceData);
    },

    // Dashboard
    getDashboardSummary: async () => {
        return apiClient.get('/api/scrap/dashboard/summary');
    },

    getScrapByGroup: async () => {
        return apiClient.get('/api/scrap/dashboard/byGroup');
    },

    getTrendData: async (days: number = 7) => {
        return apiClient.get(`/api/scrap/dashboard/trend?days=${days}`);
    },

    getRecentActivity: async () => {
        return apiClient.get('/api/scrap/dashboard/recentActivity');
    },

    getTopItems: async () => {
        return apiClient.get('/api/scrap/dashboard/topItems');
    },

    // Ledger
    getLedger: async (params?: { itemId?: number; fromDate?: string; toDate?: string }) => {
        const queryString = params
            ? '?' + new URLSearchParams(
                Object.entries(params).reduce((acc, [key, value]) => {
                    if (value !== undefined && value !== null) {
                        acc[key] = String(value);
                    }
                    return acc;
                }, {} as Record<string, string>)
            ).toString()
            : '';
        return apiClient.get(`/api/scrap/ledger${queryString}`);
    },

    getLedgerSummary: async (params?: { fromDate?: string; toDate?: string }) => {
        const queryString = params
            ? '?' + new URLSearchParams(params as any).toString()
            : '';
        return apiClient.get(`/api/scrap/ledger/summary${queryString}`);
    },

    // Invoice related APIs
    getClients: async () => {
        return apiClient.get('/api/scrap/clients');
    },

    getConsignees: async (clientId: number) => {
        return apiClient.get(`/api/scrap/consignees/${clientId}`);
    },

    getSalesLedgers: async () => {
        return apiClient.get('/api/scrap/salesledgers');
    },

    getTransporters: async () => {
        return apiClient.get('/api/scrap/transporters');
    },

    getTaxLedgers: async () => {
        return apiClient.get('/api/scrap/taxledgers');
    },

    getFreightLedgers: async () => {
        return apiClient.get('/api/scrap/freightledgers');
    },

    getScrapCategories: async () => {
        return apiClient.get('/api/scrap/scrapcategories');
    },

    getScrapItems: async (categoryId: number) => {
        return apiClient.get(`/api/scrap/items/${categoryId}`);
    },

    getCountries: async () => {
        return apiClient.get('/api/scrap/countries');
    },

    getPurchaseUnits: async () => {
        return apiClient.get('/api/scrap/purchaseunits');
    },

    getProductHSNGroups: async () => {
        return apiClient.get('/api/scrap/producthsngroups');
    },

    // New Invoice API Endpoints (GST Logic Implementation)
    getInvoiceVoucherTypes: async () => {
        return apiClient.get('/api/scrap/data/voucher-types');
    },

    getInvoicePrefixByType: async (voucherType: string) => {
        return apiClient.get(`/api/scrap/invoice/prefix-by-type?voucherType=${encodeURIComponent(voucherType)}`);
    },

    getInvoiceClients: async () => {
        return apiClient.get('/api/scrap/invoice/clients');
    },

    getInvoiceCompanyGST: async () => {
        return apiClient.get('/api/scrap/data/company-gst');
    },

    getInvoiceHSNGroups: async () => {
        return apiClient.get('/api/scrap/data/hsn-groups');
    },

    calculateInvoiceGST: async (data: {
        companyGSTApplicable: boolean;
        clientGSTApplicable: boolean;
        voucherGSTApplicable: boolean;
        companyStateTinNo: number;
        clientStateTinNo: number;
        taxableAmount: number;
        cgstTaxPercentage: number;
        sgstTaxPercentage: number;
        igstTaxPercentage: number;
    }) => {
        return apiClient.post('/api/scrap/invoice/calculate-gst', data);
    },

    saveInvoice: async (invoiceData: any) => {
        return apiClient.post('/api/scrap/invoice/create', invoiceData);
    },

    getInvoiceList: async () => {
        return apiClient.get('/api/scrap/invoice/list');
    },

    // Job Management
    getJobs: async () => {
        return apiClient.get('/api/scrap/jobs');
    },

    getJobDetails: async (bookingId: number) => {
        return apiClient.get(`/api/scrap/jobs/${bookingId}`);
    },

    getJobContents: async (jobBookingId: number) => {
        return apiClient.get(`/api/scrap/jobs/${jobBookingId}/contents`);
    },

    getJobMaterials: async (bookingId: number) => {
        return apiClient.get(`/api/scrap/jobs/${bookingId}/materials`);
    },

    // Optimized endpoint for job contents - uses /api/scrap/job-contents
    getAllJobContents: async () => {
        const productionUnitId = typeof window !== 'undefined'
            ? (localStorage.getItem('selectedProductionUnitId') || localStorage.getItem('scrap_production_unit_id'))
            : null;

        const query = productionUnitId ? `?productionUnitId=${productionUnitId}` : '';
        return apiClient.get(`/api/scrap/job-contents${query}`);
    },

    // Optimized endpoint to get production details by content ID
    // Automatically fetches parameters and executes stored procedure
    getProductionDetailsByContentId: async (contentId: number) => {
        return apiClient.get(`/api/scrap/job-contents/${contentId}/production-details`);
    },

    // Save production scrap entries and create ItemMaster records
    saveProductionScrapEntries: async (items: any[], userName?: string) => {
        return apiClient.post('/api/scrap/production-entry', { items, userName });
    },

    // Legacy endpoint - kept for backward compatibility
    getProductionItemDetails: async (
        bookingId: number,
        contentsId: number,
        productionUnitId: number = 1,
        jobContentsId: number = 0,
        procId: number = 0,
        companyId: number = 2,
        planType: string = '',
        paperByClient: boolean = false
    ) => {
        const params = new URLSearchParams({
            contentsId: contentsId.toString(),
            productionUnitId: productionUnitId.toString(),
            jobContentsId: jobContentsId.toString(),
            procId: procId.toString(),
            companyId: companyId.toString(),
            planType: planType,
            paperByClient: paperByClient.toString()
        });
        return apiClient.get(`/api/scrap/jobs/${bookingId}/production-details?${params.toString()}`);
    },
};

// ============================================
// Invoice Management APIs (Comprehensive)
// ============================================

export const invoiceApi = {
    // Lookup APIs
    getVoucherTypes: async () => {
        return apiClient.get('/api/invoice/voucher-types');
    },

    getInvoiceTypes: async () => {
        return apiClient.get('/api/invoice/invoice-types');
    },

    getClients: async () => {
        return apiClient.get('/api/invoice/clients');
    },

    getConsignees: async (clientId: number) => {
        return apiClient.get(`/api/invoice/consignees?clientId=${clientId}`);
    },

    getTransporters: async () => {
        return apiClient.get('/api/invoice/transporters');
    },

    getProductHSNGroups: async (itemSalesInvoice: boolean = false) => {
        return apiClient.get(`/api/invoice/hsn-groups?itemSalesInvoice=${itemSalesInvoice}`);
    },

    getTaxLedgers: async () => {
        return apiClient.get('/api/invoice/tax-ledgers');
    },

    getCurrencies: async () => {
        return apiClient.get('/api/invoice/currencies');
    },

    getCountries: async () => {
        return apiClient.get('/api/invoice/countries');
    },

    getPorts: async () => {
        return apiClient.get('/api/invoice/ports');
    },

    getPurchaseUnits: async () => {
        return apiClient.get('/api/invoice/purchase-units');
    },

    getCreditDays: async (ledgerId: number) => {
        return apiClient.get(`/api/invoice/credit-days/${ledgerId}`);
    },

    getCompanyConfiguration: async () => {
        return apiClient.get('/api/invoice/company-configuration');
    },

    // Invoice Operations
    getPendingOrders: async (clientId: number, consigneeId: number, invoiceType: string) => {
        return apiClient.get(`/api/invoice/pending-orders?clientId=${clientId}&consigneeId=${consigneeId}&invoiceType=${invoiceType}`);
    },

    getProcessedInvoices: async (fromDate: string, toDate: string, clientId?: number, invoiceType?: string) => {
        let url = `/api/invoice/processed-invoices?fromDate=${fromDate}&toDate=${toDate}`;
        if (clientId) url += `&clientId=${clientId}`;
        if (invoiceType) url += `&invoiceType=${invoiceType}`;
        return apiClient.get(url);
    },

    getInvoiceDetails: async (invoiceId: number) => {
        return apiClient.get(`/api/invoice/${invoiceId}/details`);
    },

    getInvoiceCharges: async (invoiceId: number) => {
        return apiClient.get(`/api/invoice/${invoiceId}/charges`);
    },

    // CRUD Operations
    saveInvoice: async (invoiceData: any) => {
        return apiClient.post('/api/invoice/save', invoiceData);
    },

    updateInvoice: async (invoiceData: any) => {
        return apiClient.put('/api/invoice/update', invoiceData);
    },

    deleteInvoice: async (invoiceId: number) => {
        return apiClient.delete(`/api/invoice/${invoiceId}`);
    },

    // Additional Operations
    approveInvoice: async (invoiceId: number) => {
        return apiClient.put(`/api/invoice/${invoiceId}/approve`, {});
    },

    cancelInvoice: async (invoiceId: number) => {
        return apiClient.put(`/api/invoice/${invoiceId}/cancel`, {});
    },

    getTallyPostStatus: async (invoiceId: number) => {
        return apiClient.get(`/api/invoice/${invoiceId}/tally-status`);
    },

    updatePODDetails: async (invoiceId: number, podData: any) => {
        return apiClient.put(`/api/invoice/${invoiceId}/pod`, podData);
    },

    // E-Invoice Operations (if needed in future)
    generateIRN: async (invoiceId: number) => {
        return apiClient.post(`/api/invoice/${invoiceId}/generate-irn`, {});
    },

    cancelIRN: async (invoiceId: number, cancelData: any) => {
        return apiClient.post(`/api/invoice/${invoiceId}/cancel-irn`, cancelData);
    },

    generateEWayBill: async (invoiceId: number, ewayData: any) => {
        return apiClient.post(`/api/invoice/${invoiceId}/generate-eway`, ewayData);
    },
};

export default apiClient;
