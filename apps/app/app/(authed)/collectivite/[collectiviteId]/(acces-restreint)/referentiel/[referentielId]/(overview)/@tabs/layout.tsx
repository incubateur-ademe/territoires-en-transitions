import { ReferentielViewModeProvider } from '@/app/referentiels/referentiel.table/use-referentiel-view-mode';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
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
    <ReferentielViewModeProvider>
      <Header referentielId={referentielId} />

      <TabsWrapper>{children}</TabsWrapper>
    </ReferentielViewModeProvider>
  );
}
