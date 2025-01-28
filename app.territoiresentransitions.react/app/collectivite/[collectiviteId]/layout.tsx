import { CollectiviteProvider } from '@/app/collectivites/collectivite-context';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: number }>;
}) {
  const { collectiviteId } = await params;

  return (
    <CollectiviteProvider collectiviteId={collectiviteId}>
      {children}
    </CollectiviteProvider>
  );
}
