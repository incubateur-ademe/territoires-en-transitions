'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isIndicateurPerso } from '@tet/domain/indicateurs';
import { Tab, Tabs } from '@tet/ui';
import { useIndicateurData } from './context/indicateur-data.context';
import { IndicateurDonnees } from './content/donnees/indicateur-donnees.view';
import { IndicateurFichesLiees } from './content/fiches-liees/indicateur-fiches-liees.view';
import { IndicateurInformations } from './content/informations/indicateur-informations.view';
import { IndicateurMesuresLiees } from './content/mesures-liees/indicateur-mesures-liees.view';
import { IndicateurSousIndicateurs } from './content/sous-indicateurs/indicateur-sous-indicateurs.view';

export const IndicateurTabs = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { hasCollectivitePermission, isSimplifiedView } =
    useCurrentCollectivite();

  const { enfants = [], description, mesures } = indicateur;
  const isPerso = isIndicateurPerso(indicateur);

  const hasSousIndicateursTab =
    !isPerso && enfants.length > 0 && !indicateur.sansValeurUtilisateur;
  const hasMesuresLieesTab =
    !isPerso &&
    hasCollectivitePermission('referentiels.read') &&
    !isSimplifiedView;
  const hasFichesLieesTab = hasCollectivitePermission('plans.fiches.read');
  const hasInformationsTab = !isPerso && !!description;

  return (
    <Tabs tabsListClassName="justify-start flex-nowrap overflow-x-auto">
      <Tab label={appLabels.indicateurOngletDonnees}>
        <IndicateurDonnees />
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
