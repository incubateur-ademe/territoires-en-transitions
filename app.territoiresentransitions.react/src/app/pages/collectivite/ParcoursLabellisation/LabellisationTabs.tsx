import {Tabs, Tab} from 'ui/shared/Tabs';
import {useAudit} from '../Audit/useAudit';
import AuditSuivi from '../AuditSuivi';
import {
  useCollectiviteId,
  useLabellisationVue,
  useReferentielId,
} from 'core-logic/hooks/params';
import {
  LabellisationVueParamOption,
  makeCollectiviteLabellisationUrl,
  ReferentielParamOption,
} from 'app/paths';
import {useHistory} from 'react-router-dom';
import AuditComparaison from '../AuditComparaison';
import CriteresLabellisation from './CriteresLabellisation';
import {Alert} from '@tet/ui';

// index des onglets de la page Labellisation
const TABS_INDEX: Record<LabellisationVueParamOption, number> = {
  suivi: 0,
  cycles: 1,
  criteres: 2,
};

/**
 * Affiche les onglets "Suivi de l'audit", "Cycle et comparaison" et "Critères
 * de labellisation".
 *
 * Dans le cas où il n'y a pas d'audit en cours, seul le contenu de l'onglet
 * "Critères de labellisation" est visible (sans les onglets).
 */
export const LabellisationTabs = () => {
  const history = useHistory();
  const {data: audit} = useAudit();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;
  const vue = useLabellisationVue();
  const activeTab = vue ? TABS_INDEX[vue] : TABS_INDEX['suivi'];

  // synchronise l'url lors du passage d'un onglet à l'autre
  const handleChange = (activeTab: number) => {
    // recherche le nom de la vue correspondant à l'onglet courant
    const view = Object.entries(TABS_INDEX).find(
      ([, index]) => index === activeTab
    );
    const name = view?.[0] as LabellisationVueParamOption;

    // met à jour l'url
    if (collectiviteId && name && name !== vue) {
      history.replace(
        makeCollectiviteLabellisationUrl({
          collectiviteId,
          referentielId,
          labellisationVue: name,
        })
      );
    }
  };

  return audit ? (
    <>
      <EnSavoirPlus />
      <Tabs
        defaultActiveTab={activeTab}
        onChange={handleChange}
        className="w-full"
      >
        <Tab label="Suivi de l'audit">
          <AuditSuivi />
        </Tab>
        <Tab label="Cycles et comparaison">
          {activeTab === TABS_INDEX['cycles'] ? <AuditComparaison /> : '...'}
        </Tab>
        <Tab label="Critères de labellisation">
          {activeTab === TABS_INDEX['criteres'] ? (
            <CriteresLabellisation />
          ) : (
            '...'
          )}
        </Tab>
      </Tabs>
    </>
  ) : (
    <CriteresLabellisation />
  );
};

const EnSavoirPlus = () => (
  <Alert
    className="mb-8"
    title="En savoir plus sur l’avancement de l’audit"
    description={
      <ul>
        <li>
          <strong>Non audité</strong> : une personne en charge de l'audit a été
          nommée mais le travail d'audit n'a pas encore commencé pour cette
          action.
        </li>
        <li>
          <strong>Audit en cours</strong> : l'audit est en cours pour cette
          action. Seule la personne en charge de l'audit peut modifier les
          statuts des sous-actions et tâches. Les textes, les preuves et les
          indicateurs ne sont à modifier qu'à la demande de la personne en
          charge de l'audit.
        </li>
        <li>
          <strong>Audité</strong> : cette action a été validée par la personne
          en charge de l'audit. Les statuts seront de nouveau modifiables
          lorsque l'audit ou la labellisation seront validés.
        </li>
      </ul>
    }
  />
);
