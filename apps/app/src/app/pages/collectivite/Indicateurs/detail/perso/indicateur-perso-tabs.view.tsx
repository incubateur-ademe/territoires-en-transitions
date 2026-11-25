'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Tab, Tabs } from '@tet/ui';
import { IndicateurFichesLiees } from '../content/fiches-liees/indicateur-fiches-liees.view';
import { IndicateurDonnees } from '../content/donnees/indicateur-donnees.view';

export const IndicateurPersoTabs = () => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const hasFichesLieesTab = hasCollectivitePermission('plans.fiches.read');

  return (
    <Tabs tabsListClassName="justify-start flex-nowrap overflow-x-auto">
      <Tab label={appLabels.indicateurOngletDonnees}>
        <IndicateurDonnees />
      </Tab>

      {hasFichesLieesTab ? (
        <Tab label={appLabels.actionsLiees}>
          <IndicateurFichesLiees />
        </Tab>
      ) : undefined}
    </Tabs>
  );
};
