'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <PageHeader>
        <PageHeader.Title>{appLabels.maCollectivite}</PageHeader.Title>
      </PageHeader>
      <Tabs tabsListClassName="justify-start">
        <TabsList className="justify-start">
          <TabsTab href="presentation" label="Présentation" />
          <TabsTab href="personnalisation" label="Personnalisation" />
        </TabsList>
        <TabsPanel className="pt-2">{children}</TabsPanel>
      </Tabs>
    </>
  );
}
