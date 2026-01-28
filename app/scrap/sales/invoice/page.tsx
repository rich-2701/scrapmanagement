'use client';

import React, { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { ScrapInvoice } from '@/components/pages/ScrapInvoice';

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ScrapInvoice />
    </Suspense>
  );
}