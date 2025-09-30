import { ReferentielId } from '@/domain/referentiels';
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
    <>
      <Header referentielId={referentielId} />

      <Tabs>
        <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
          <TabsTab href="progression" label="Mesures" />
          <TabsTab href="priorisation" label="Aide à la priorisation" />
          <TabsTab href="detail" label="Détail des statuts" />
          <TabsTab href="evolutions" label="Évolutions du score" />
        </TabsList>

        <TabsPanel>{children}</TabsPanel>
      </Tabs>
    </>
  );
}
