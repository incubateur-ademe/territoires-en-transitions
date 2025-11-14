import { ReferentielId } from '@/domain/referentiels';
import { ReactNode } from 'react';
import { Header } from './header';
import { TabsWrapper } from './tabs-wrapper';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ referentielId: ReferentielId }>;
}) {
  const { referentielId } = await params;

  return (
    <>
      <Header referentielId={referentielId} />

      <TabsWrapper>{children}</TabsWrapper>
    </>
  );
}
