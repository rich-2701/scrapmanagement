'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { Profile } from '@/components/pages/Profile';

export default function ProfilePage() {
  return (
    <Layout activePage="profile">
      <Profile />
    </Layout>
  );
}