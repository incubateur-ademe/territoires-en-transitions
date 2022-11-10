import {Tabs, Tab} from '@dataesr/react-dsfr';
import {ReactElement} from 'react';
import Alerte from 'ui/shared/Alerte';
import {useAudit} from '../Audit/useAudit';
import AuditSuivi from '../AuditSuivi';

export type TLabellisationTabsProps = {
  children: ReactElement;
};

/**
 * Affiche les onglets "Suivi de l'audit", "Cycle et comparaison" et "Critères
 * de labellisation".
 *
 * Dans le cas où il n'y a pas d'audit en cours, seul le contenu de l'onglet
 * "Critèères de labellisation" est visible (sans les onglets).
 */
export const LabellisationTabs = (props: TLabellisationTabsProps) => {
  const {children} = props;
  const {data: audit} = useAudit();

  return audit ? (
    <>
      <Alerte
        classname="fr-mb-4w"
        state="information"
        titre="En savoir plus sur l’avancement de l’audit"
      >
        <ul>
          <li>
            <strong>Non audité</strong> : une personne en charge de l'audit a
            été nommée mais le travail d'audit n'a pas encore commencé pour
            cette action.
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
      </Alerte>
      <Tabs className="w-full">
        <Tab label="Suivi de l'audit">
          <AuditSuivi />
        </Tab>
        <Tab label="Critères de labellisation">{children}</Tab>
      </Tabs>
    </>
  ) : (
    children
  );
};
