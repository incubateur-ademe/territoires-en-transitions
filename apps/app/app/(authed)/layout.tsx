import { getUser } from '@/api/users/user-details.fetch.server';
import Header from '@/app/app/Layout/Header';
import { ReactNode } from 'react';
import AppProviders from './app-providers';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <AppProviders user={user}>
      <Header />
    </AppProviders>
  );
}
