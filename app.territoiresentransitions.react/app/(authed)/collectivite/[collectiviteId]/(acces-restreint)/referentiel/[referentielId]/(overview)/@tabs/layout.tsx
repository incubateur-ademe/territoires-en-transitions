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

      <Tabs tabsListClassName="!justify-start pl-0 flex-nowrap bg-transparent">
        <TabsList>
          <TabsTab href="progression" label="Actions"></TabsTab>
          <TabsTab href="priorisation" label="Aide à la priorisation"></TabsTab>
          <TabsTab href="detail" label="Détail des statuts"></TabsTab>
        </TabsList>

        <TabsPanel>{children}</TabsPanel>
      </Tabs>
    </PageContainer>
  );
}
