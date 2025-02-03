import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import Footer from '@/app/app/Layout/Footer';
import Header from '@/app/app/Layout/Header';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/');
  }

  return (
    <AppProviders user={user}>
      <Header />
      {children}
      <Footer />
    </AppProviders>
  );
}
