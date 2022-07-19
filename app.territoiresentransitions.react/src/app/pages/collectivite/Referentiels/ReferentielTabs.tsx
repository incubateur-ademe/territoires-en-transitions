import {useHistory} from 'react-router-dom';
import {Tab} from '@dataesr/react-dsfr';
import Tabs from 'ui/shared/Tabs';
import {referentielToName} from 'app/labels';
import {
  makeCollectiviteReferentielUrl,
  ReferentielParamOption,
  ReferentielVueParamOption,
} from 'app/paths';
import {
  useCollectiviteId,
  useReferentielId,
  useReferentielVue,
} from 'core-logic/hooks/params';
import {ReferentielOfIndicateur} from 'types/litterals';
import AidePriorisation from '../AidePriorisation';
import Progression from './Referentiels';
import DetailTacheTable from '../DetailTaches';

const TABS_INDEX: Record<ReferentielVueParamOption, number> = {
  progression: 0,
  priorisation: 1,
  detail: 2,
};

/**
 * Affiche les onglets des vues tabulaires sur le référentiel
 */
export default () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;
  const referentielVue = useReferentielVue();
  const history = useHistory();

  if (!referentielId || !referentielVue) {
    return null;
  }

  const activeTab = TABS_INDEX[referentielVue];

  // synchronise l'url lors du passage d'un onglet à l'autre
  const handleChange = (activeTab: number) => {
    if (collectiviteId && referentielId) {
      // recherche le nom de la vue correspondant à l'onglet courant
      const view = Object.entries(TABS_INDEX).find(
        ([, index]) => index === activeTab
      );
      const name = view?.[0] as ReferentielVueParamOption;

      // met à jour l'url
      if (name && name !== referentielVue) {
        history.replace(
          makeCollectiviteReferentielUrl({
            collectiviteId,
            referentielId,
            referentielVue: name,
          })
        );
      }
    }
  };

  return (
    <main className="fr-container fr-mt-4w flex flex-col items-center">
      <h1 className="fr-mb-4w">
        Référentiel{' '}
        {referentielToName[referentielId as ReferentielOfIndicateur]}
      </h1>
      <Tabs className="w-full" activeTab={activeTab} onChange={handleChange}>
        <Tab label="Progression">
          <Progression />
        </Tab>
        <Tab label="Aide à la priorisation">
          <AidePriorisation />
        </Tab>
        <Tab label="Détail des tâches">
          <DetailTacheTable />
        </Tab>
      </Tabs>
    </main>
  );
};
