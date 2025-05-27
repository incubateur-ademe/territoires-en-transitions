'use client';

import { useAudit } from '@/app/referentiels/audits/useAudit';
import CriteresLabellisationConnected from '@/app/referentiels/labellisations/CriteresLabellisation';
import { Alert } from '@/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/ui/design-system/Tabs/Tabs.next';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { data: audit } = useAudit();

  if (!audit) {
    return <CriteresLabellisationConnected />;
  }

  return (
    <>
      <EnSavoirPlus />
      <Tabs className="w-full">
        <TabsList className="!justify-start pl-0 flex-nowrap bg-transparent">
          <TabsTab label="Suivi de l'audit" href="suivi" />
          <TabsTab label="Cycles et comparaison" href="cycles" />
          <TabsTab label="Critères de labellisation" href="criteres" />
        </TabsList>
        <TabsPanel>{children}</TabsPanel>
      </Tabs>
    </>
  );
}

const EnSavoirPlus = () => (
  <Alert
    className="mb-8"
    title="En savoir plus sur l'avancement de l'audit"
    description={
      <ul>
        <li>
          <strong>Non audité</strong>
          {
            " : une personne en charge de l'audit a été nommée mais le travail d'audit n'a pas encore commencé pour cette action."
          }
        </li>
        <li>
          <strong>Audit en cours</strong>
          {
            " : l'audit est en cours pour cette action. Seule la personne en charge de l'audit peut modifier les statuts des sous-actions et tâches. Les textes, les preuves et les indicateurs ne sont à modifier qu'à la demande de la personne en charge de l'audit."
          }
        </li>
        <li>
          <strong>Audité</strong>
          {
            " : cette action a été validée par la personne en charge de l'audit. Les statuts seront de nouveau modifiables lorsque l'audit ou la labellisation seront validés."
          }
        </li>
      </ul>
    }
  />
);
