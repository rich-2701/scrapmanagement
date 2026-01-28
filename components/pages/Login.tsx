'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, ArrowRight, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Company } from '@/lib/types';
import { authApi } from '@/lib/api';

export const Login: React.FC = () => {
  const router = useRouter();
  const [authStage, setAuthStage] = useState<'COMPANY' | 'USER'>('COMPANY');
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Form States
  const [companyUser, setCompanyUser] = useState('');
  const [companyPass, setCompanyPass] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authApi.authenticateCompany(companyUser, companyPass);

      if (result.success && result.data) {
        const companyData = result.data as any;

        // Store company credentials in localStorage for session management
        localStorage.setItem('scrap_company_user', companyUser);
        localStorage.setItem('scrap_company_pass', companyPass);
        localStorage.setItem('scrap_company_data', JSON.stringify(companyData));

        // Store in sessionStorage
        sessionStorage.setItem('scrap_company_user', companyUser);
        sessionStorage.setItem('scrap_company_pass', companyPass);
        sessionStorage.setItem('scrap_company_data', JSON.stringify(companyData));

        setCompanyData({
          id: companyData.id,
          name: companyData.name,
          code: companyData.code
        });
        setAuthStage('USER');
      } else {
        setError('Invalid credentials please try again');
        setShowErrorModal(true);
      }
    } catch (err: any) {
      setError('Invalid credentials please try again');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pass company credentials via Basic Auth along with user credentials
      const result = await authApi.authenticateUser(username, password, companyUser, companyPass);

      if (result.success && result.data) {
        // Map backend response (Id, Username, Email, Role) to frontend format
        const userData = result.data as any;

        // Store user credentials and data in localStorage for session management
        localStorage.setItem('scrap_user_name', username);
        localStorage.setItem('scrap_user_pass', password);
        localStorage.setItem('scrap_user_data', JSON.stringify(userData));
        localStorage.setItem('scrap_user_id', userData.userId || userData.Id || '');
        localStorage.setItem('scrap_company_id', userData.companyId || '');
        localStorage.setItem('scrap_production_unit_id', userData.productionUnitId || '');
        localStorage.setItem('scrap_auth_timestamp', Date.now().toString());

        // Store in sessionStorage as well
        sessionStorage.setItem('scrap_user_name', username);
        sessionStorage.setItem('scrap_user_pass', password);
        sessionStorage.setItem('scrap_user_data', JSON.stringify(userData));
        sessionStorage.setItem('scrap_user_id', userData.userId || userData.Id || '');
        sessionStorage.setItem('scrap_company_id', userData.companyId || '');
        sessionStorage.setItem('scrap_production_unit_id', userData.productionUnitId || '');
        sessionStorage.setItem('scrap_auth_timestamp', Date.now().toString());

        // Redirect to dashboard after successful login
        router.push('/');
      } else {
        setError('Invalid credentials please try again');
        setShowErrorModal(true);
      }
    } catch (err: any) {
      setError('Invalid credentials please try again');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Authentication Failed</h3>
              <p className="text-slate-600 mb-6">{error}</p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 font-sans text-slate-600">
        <div className="max-w-[400px] w-full bg-white rounded-xl shadow-xl shadow-blue-100/50 border border-blue-100 overflow-hidden">

          {/* Simple Professional Header */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-blue-50">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-200">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-xl font-bold text-slate-700">Scrap Manager ERP</h1>
            <p className="text-sm text-slate-400 mt-1">
              {authStage === 'COMPANY' ? 'Organization Login' : companyData?.name}
            </p>
          </div>

          <div className="p-8 bg-white">

            {/* Steps Indicator */}
            <div className="flex items-center justify-center mb-6 space-x-2">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${authStage === 'COMPANY' ? 'w-10 bg-blue-600' : 'w-2 bg-blue-100'}`}></div>
              <div className={`h-1.5 rounded-full transition-all duration-300 ${authStage === 'USER' ? 'w-10 bg-blue-600' : 'w-2 bg-blue-100'}`}></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-500 text-xs p-3 rounded-lg flex items-center mb-6 border border-red-100 animate-in slide-in-from-top-1">
                <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Step 1: Company Login */}
            {authStage === 'COMPANY' && (
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Company ID</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3 top-3 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={companyUser}
                      onChange={(e) => setCompanyUser(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-blue-200/50"
                      placeholder="e.g. printpack"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Access Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="password"
                      value={companyPass}
                      onChange={(e) => setCompanyPass(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-blue-200/50"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Verifying...' : 'Next Step'}
                  {!loading && <ArrowRight size={16} className="ml-2" />}
                </button>
              </form>
            )}

            {/* Step 2: User Login */}
            {authStage === 'USER' && (
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Username</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-blue-200/50"
                      placeholder="e.g. admin"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-blue-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-blue-100 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-blue-200/50"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setAuthStage('COMPANY')}
                    className="px-3 py-3 rounded-lg border border-blue-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing In...' : 'Access Dashboard'}
                    {!loading && <ArrowRight size={16} className="ml-2" />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};