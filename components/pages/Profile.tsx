
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Building2, Mail, Hash, Briefcase, Calendar, Clock, LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [companyUser, setCompanyUser] = useState('');
  const [userRole, setUserRole] = useState('USER');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCompanyUser = localStorage.getItem('scrap_company_user');
      const storedUserName = localStorage.getItem('scrap_user_name');
      const storedUserRole = localStorage.getItem('scrap_user_role');

      if (!storedCompanyUser || !storedUserName) {
        router.push('/login');
        return;
      }

      setCompanyUser(storedCompanyUser);
      setUserName(storedUserName);
      setUserRole(storedUserRole || 'USER');
    }
  }, [router]);
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900"></div>
        <div className="px-8 pb-8">
           <div className="relative -mt-12 mb-4 flex justify-between items-end">
             <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
                <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold">
                   {userName.charAt(0).toUpperCase()}
                </div>
             </div>
             <div className="mb-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${userRole === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                   {userRole}
                </span>
             </div>
           </div>

           <div>
             <h1 className="text-2xl font-bold text-slate-800">{userName}</h1>
             <p className="text-slate-500">@{userName.toLowerCase().replace(/\s+/g, '')}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Company Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center">
             <Building2 size={16} className="mr-2 text-blue-600" />
             Organization Details
           </h3>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Company Name</p>
                 <p className="font-semibold text-slate-800">{companyUser}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Company Code</p>
                 <p className="font-mono font-semibold text-slate-800">{companyUser.toUpperCase()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">License Status</p>
                 <p className="font-semibold text-green-600 flex items-center">
                   <Shield size={14} className="mr-1.5" /> Active Enterprise
                 </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">System Version</p>
                 <p className="font-semibold text-slate-800">v1.2.4 (Latest)</p>
              </div>
           </div>
        </div>

        {/* User Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center">
             <Briefcase size={16} className="mr-2 text-blue-600" />
             Account Info
           </h3>

           <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail size={16} />
                </div>
                <div>
                   <p className="text-xs text-slate-400">Username</p>
                   <p className="font-medium text-slate-700">{userName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Hash size={16} />
                </div>
                <div>
                   <p className="text-xs text-slate-400">Role</p>
                   <p className="font-medium text-slate-700">{userRole}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock size={16} />
                </div>
                <div>
                   <p className="text-xs text-slate-400">Last Login</p>
                   <p className="font-medium text-slate-700">Just Now</p>
                </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center pt-8 pb-4">
         <p className="text-xs text-slate-400">Logged in securely via Double-Encryption Protocol.</p>
      </div>
    </div>
  );
};