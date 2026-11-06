'use client';

import {
  labellisationsAdminCotUrl,
  labellisationsAdminEnCoursUrl,
  labellisationsAdminClosUrl,
  labellisationsAdminUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@tet/ui/design-system/TabsNext/index';
import { ReactNode } from 'react';

/** En-tête et onglets communs aux listes de dossiers et des COT. */
export const LabellisationsAdminLayout = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-6 pb-12">
    <PageHeader>
      <PageHeader.Title>{appLabels.labellisationsAdminTitre}</PageHeader.Title>
    </PageHeader>
    <Tabs variant="pill">
      <TabsList className="!justify-start pl-0">
        <TabsTab
          href={labellisationsAdminUrl}
          label={appLabels.labellisationsAdminOngletEnAttente}
          dataTest="referentiels.labellisations-admin.onglet-en-attente"
        />
        <TabsTab
          href={labellisationsAdminEnCoursUrl}
          label={appLabels.labellisationsAdminOngletEnCours}
          dataTest="referentiels.labellisations-admin.onglet-en-cours"
        />
        <TabsTab
          href={labellisationsAdminClosUrl}
          label={appLabels.labellisationsAdminOngletClos}
          dataTest="referentiels.labellisations-admin.onglet-clos"
        />
        <TabsTab
          href={labellisationsAdminCotUrl}
          label={appLabels.labellisationsAdminOngletCot}
          dataTest="referentiels.labellisations-admin.onglet-cot"
        />
      </TabsList>
      <TabsPanel>{children}</TabsPanel>
    </Tabs>
  </div>
);
