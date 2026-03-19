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
      <h2 className="mb-4">Ma collectivité</h2>
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
