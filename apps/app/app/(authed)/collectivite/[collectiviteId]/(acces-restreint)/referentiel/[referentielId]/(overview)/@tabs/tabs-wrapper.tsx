'use client';

import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { PropsWithChildren } from 'react';

export const TabsWrapper = ({ children }: PropsWithChildren) => {
  const isVisitor = useIsVisitor();

  return (
    <Tabs className="grow flex flex-col">
      <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent overflow-x-auto">
        <TabsTab href="progression" label="Mesures" />
        <TabsTab href="priorisation" label="Aide à la priorisation" />
        <TabsTab href="detail" label="Détail des statuts" />
        <TabsTab href="evolutions" label="Évolutions du score" />
        {!isVisitor && <TabsTab href="commentaires" label="Commentaires" />}
      </TabsList>

      <TabsPanel>{children}</TabsPanel>
    </Tabs>
  );
};
