import { fetchUserDetails } from '@/api/users/user-details.fetch.server';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import AppHeader from '@/app/app/Layout/Header';
import { renderLoader } from '@/app/utils/renderLoader';
import { redirect } from 'next/navigation';
import { ReactNode, Suspense } from 'react';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/');
  }

  const user = await fetchUserDetails(authUser);

  return (
    <AppProviders user={user}>
      <AppHeader />
      <Suspense fallback={renderLoader()}>{children}</Suspense>
    </AppProviders>
  );
}
