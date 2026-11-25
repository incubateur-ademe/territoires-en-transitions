'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Tab, Tabs } from '@tet/ui';
import { IndicateurDonnees } from '../content/donnees/indicateur-donnees.view';
import { IndicateurFichesLiees } from '../content/fiches-liees/indicateur-fiches-liees.view';
import { useIndicateurData } from '../context/indicateur-data.context';
import { IndicateurPredefiniAvecEnfantsDonnees } from './donnees/indicateur-predefini-avec-enfants-donnees.view';
import { IndicateurInformations } from './informations/indicateur-informations.view';
import { IndicateurMesuresLiees } from './mesures-liees/indicateur-mesures-liees.view';

export const IndicateurPredefiniTabs = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { hasCollectivitePermission, isSimplifiedView } =
    useCurrentCollectivite();

  const { enfants = [], description, mesures } = indicateur;

  const hasEnfants = enfants.length > 0;
  const hasMesuresLieesTab =
    hasCollectivitePermission('referentiels.read') && !isSimplifiedView;
  const hasFichesLieesTab = hasCollectivitePermission('plans.fiches.read');
  const hasInformationsTab = !!description;

  return (
    <Tabs tabsListClassName="justify-start flex-nowrap overflow-x-auto">
      <Tab label={appLabels.indicateurOngletDonnees}>
        {hasEnfants ? (
          <IndicateurPredefiniAvecEnfantsDonnees />
        ) : (
          <IndicateurDonnees />
        )}
      </Tab>

      {hasMesuresLieesTab ? (
        <Tab label={appLabels.mesuresDesReferentiels}>
          <IndicateurMesuresLiees
            isReadonly={!canMutateIndicateur}
            actionsIds={mesures?.map((mesure) => mesure.id) ?? []}
          />
        </Tab>
      ) : undefined}

      {hasFichesLieesTab ? (
        <Tab label={appLabels.actionsLiees}>
          <IndicateurFichesLiees />
        </Tab>
      ) : undefined}

      {hasInformationsTab ? (
        <Tab label={appLabels.indicateurOngletInformations}>
          <IndicateurInformations description={description} />
        </Tab>
      ) : undefined}
    </Tabs>
  );
};
