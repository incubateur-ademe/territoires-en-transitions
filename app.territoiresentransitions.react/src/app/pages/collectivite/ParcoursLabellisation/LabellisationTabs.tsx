import {Tabs, Tab} from '@dataesr/react-dsfr';
import {ReactElement} from 'react';
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
    <Tabs className="w-full">
      <Tab label="Suivi de l'audit">
        <AuditSuivi />
      </Tab>
      <Tab label="Critères de labellisation">{children}</Tab>
    </Tabs>
  ) : (
    children
  );
};
