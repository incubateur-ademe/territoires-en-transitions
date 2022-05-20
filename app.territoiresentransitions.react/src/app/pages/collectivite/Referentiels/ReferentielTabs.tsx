import {Tabs, Tab} from '@dataesr/react-dsfr';
import {referentielToName} from 'app/labels';
import {ReferentielVueParamOption} from 'app/paths';
import {useReferentielId, useReferentielVue} from 'core-logic/hooks/params';
import {ReferentielOfIndicateur} from 'types/litterals';
import DetailTacheTable from '../DetailTaches';
import Referentiels from './Referentiels';

export type TReferentielTabsProps = {};

const TABS_INDEX: Record<ReferentielVueParamOption, number> = {
  progression: 0,
  priorisation: 1,
  //  detail: 2,
  detail: 1,
};

/**
 * Affiche les onglets des vues tabulaires sur le référentiel
 */
export default (props: TReferentielTabsProps) => {
  //  const {defaultActiveTab, ...other} = props;
  const referentielId = useReferentielId();
  const referentielVue = useReferentielVue();

  if (!referentielId || !referentielVue) {
    return null;
  }

  const defaultActiveTab = TABS_INDEX[referentielVue];

  return (
    <main className="fr-container fr-mt-4w flex flex-col items-center">
      <h1 className="fr-mb-4w">
        Référentiel{' '}
        {referentielToName[referentielId as ReferentielOfIndicateur]}
      </h1>
      <Tabs className="w-full" defaultActiveTab={defaultActiveTab}>
        <Tab label="Progression">
          <Referentiels />
        </Tab>
        <Tab label="Détail des tâches">
          <DetailTacheTable />
        </Tab>
      </Tabs>
    </main>
  );
};
