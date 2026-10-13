import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  if (!hasPermission(user, 'utils.backoffice.read')) {
    notFound();
  }

  return children;
}
