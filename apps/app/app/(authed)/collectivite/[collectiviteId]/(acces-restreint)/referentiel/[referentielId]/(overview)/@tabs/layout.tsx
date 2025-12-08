import { referentielIdEnumSchema } from '@/domain/referentiels';
import { ReactNode } from 'react';
import { Header } from './header';
import { TabsWrapper } from './tabs-wrapper';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; referentielId: string }>;
}) {
  const { referentielId: unsafeReferentielId } = await params;
  const referentielId = referentielIdEnumSchema.parse(unsafeReferentielId);

  return (
    <>
      <Header referentielId={referentielId} />

      <TabsWrapper>{children}</TabsWrapper>
    </>
  );
}
