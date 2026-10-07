import { AccesRestreintGuard } from '@/app/collectivites/acces-restreint.guard';
import StandardOnlyLayout from '@/app/collectivites/standard-only.layout';
import { ReactNode } from 'react';

export default function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  return (
    <StandardOnlyLayout params={params}>
      <AccesRestreintGuard>{children}</AccesRestreintGuard>
    </StandardOnlyLayout>
  );
}
