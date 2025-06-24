import { fetchUserDetails } from '@/api/users/user-details.fetch.server';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import Header from '@/app/app/Layout/Header';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/');
  }

  const user = await fetchUserDetails(authUser);

  return (
    <AppProviders user={user}>
      <Header />
      
      {children}
    </AppProviders>
  );
}
