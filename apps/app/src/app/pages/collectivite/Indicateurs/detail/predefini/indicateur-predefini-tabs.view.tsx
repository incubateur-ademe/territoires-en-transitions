'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Tab, Tabs } from '@tet/ui';
import { IndicateurFichesLiees } from '../content/fiches-liees/indicateur-fiches-liees.view';
import { useIndicateurData } from '../context/indicateur-data.context';
import { IndicateurPredefiniComposeDonnees } from './donnees/indicateur-predefini-compose-donnees.view';
import { IndicateurPredefiniDonnees } from './donnees/indicateur-predefini-donnees.view';
import { isComposeSansAgregation } from './indicateur-predefini-compose.rules';
import { IndicateurInformations } from './informations/indicateur-informations.view';
import { IndicateurMesuresLiees } from './mesures-liees/indicateur-mesures-liees.view';
import { IndicateurSousIndicateurs } from './sous-indicateurs/indicateur-sous-indicateurs.view';

export const IndicateurPredefiniTabs = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { hasCollectivitePermission, isSimplifiedView } =
    useCurrentCollectivite();

  const { enfants = [], description, mesures } = indicateur;

  const isCompose = isComposeSansAgregation(indicateur);
  const hasSousIndicateursTab = enfants.length > 0 && !isCompose;
  const hasMesuresLieesTab =
    hasCollectivitePermission('referentiels.read') && !isSimplifiedView;
  const hasFichesLieesTab = hasCollectivitePermission('plans.fiches.read');
  const hasInformationsTab = !!description;

  return (
    <Tabs tabsListClassName="justify-start flex-nowrap overflow-x-auto">
      <Tab label={appLabels.indicateurOngletDonnees}>
        {isCompose ? (
          <IndicateurPredefiniComposeDonnees />
        ) : (
          <IndicateurPredefiniDonnees />
        )}
      </Tab>

      {hasSousIndicateursTab ? (
        <Tab label={appLabels.sousIndicateur({ count: enfants.length })}>
          <IndicateurSousIndicateurs
            enfantsIds={enfants.map(({ id }) => id)}
            isReadonly={!canMutateIndicateur}
          />
        </Tab>
      ) : undefined}

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
