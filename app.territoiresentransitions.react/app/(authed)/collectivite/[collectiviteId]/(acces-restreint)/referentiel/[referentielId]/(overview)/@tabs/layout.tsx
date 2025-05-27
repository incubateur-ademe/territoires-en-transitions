import { ReferentielId } from '@/domain/referentiels';
import PageContainer from '@/ui/components/layout/page-container';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import { ReactNode } from 'react';
import { Header } from './header';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ referentielId: ReferentielId }>;
}) {
  const { referentielId } = await params;

  return (
    <PageContainer>
      <Header referentielId={referentielId} />

      <Tabs>
        <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
          <TabsTab href="progression" label="Mesures"></TabsTab>
          <TabsTab href="priorisation" label="Aide à la priorisation"></TabsTab>
          <TabsTab href="detail" label="Détail des statuts"></TabsTab>
          <TabsTab href="evolutions" label="Évolutions du score"></TabsTab>
        </TabsList>

        <TabsPanel>{children}</TabsPanel>
      </Tabs>
    </PageContainer>
  );
}
