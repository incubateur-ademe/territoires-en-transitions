import { getUser } from '@/api/users/user-details.fetch.server';
import Header from '@/app/app/Layout/Header';
import { renderLoader } from '@/app/utils/renderLoader';
import { ReactNode, Suspense } from 'react';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <AppProviders user={user}>
      <Header />
      <Suspense fallback={renderLoader()}>{children}</Suspense>
    </AppProviders>
  );
}
