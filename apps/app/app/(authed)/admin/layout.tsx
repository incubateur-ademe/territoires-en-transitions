import { listAllowedBackofficeTools } from '@/app/utils/backoffice/backoffice-tools';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await getUser();

  if (listAllowedBackofficeTools(user).length === 0) {
    notFound();
  }

  return children;
}
