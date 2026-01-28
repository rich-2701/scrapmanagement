'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EntryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to production entry by default
    router.replace('/scrap/entry/production');
  }, [router]);

  return null;
}