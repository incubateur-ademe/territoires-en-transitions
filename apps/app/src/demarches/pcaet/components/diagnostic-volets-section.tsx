'use client';

import {
  DEMARCHE_PCAET_VOLETS,
  type DemarchePcaetVoletConfig,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type {
  DemarchePcaet,
  DemarchePcaetVoletId,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { getDiagnosticVoletStatut } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { useState } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';
import { VoletDiagnosticPanelContent } from './volet-diagnostic-panel-content';
import { VoletTab } from './volet-tab';

type Props = {
  collectiviteId: number;
  demarche: DemarchePcaet;
  isReadonly?: boolean;
  onVulnerabiliteChange: (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ) => void;
};

const getVoletById = (
  voletId: DemarchePcaetVoletId
): DemarchePcaetVoletConfig => {
  const volet = DEMARCHE_PCAET_VOLETS.find((item) => item.id === voletId);
  if (!volet) {
    throw new Error(`Unknown PCAET volet: ${voletId}`);
  }
  return volet;
};

export const DiagnosticVoletsSection = ({
  collectiviteId,
  demarche,
  isReadonly = false,
  onVulnerabiliteChange,
}: Props) => {
  const [activeVoletId, setActiveVoletId] = useState<DemarchePcaetVoletId>(
    DEMARCHE_PCAET_VOLETS[0].id
  );
  const activeVolet = getVoletById(activeVoletId);

  return (
    <DemarchePcaetSection
      title={appLabels.demarchePcaetDiagnosticTitre}
      description={appLabels.demarchePcaetDiagnosticDescription}
    >
      <Tabs dataTest="demarche-pcaet-diagnostic-volets">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-transparent p-0 m-0 rounded-none w-full !list-none justify-stretch">
          {DEMARCHE_PCAET_VOLETS.map((volet) => (
            <VoletTab
              key={volet.id}
              volet={volet}
              isActive={activeVoletId === volet.id}
              isComplete={
                getDiagnosticVoletStatut(demarche, volet.id) === 'complete'
              }
              onSelect={() => setActiveVoletId(volet.id)}
            />
          ))}
        </TabsList>

        <TabsPanel className="mt-6 border border-grey-3 bg-white p-4 lg:p-6">
          <div
            role="tabpanel"
            id={`demarche-volet-panel-${activeVoletId}`}
            aria-labelledby={`demarche-volet-tab-${activeVoletId}`}
          >
            <VoletDiagnosticPanelContent
              key={activeVoletId}
              volet={activeVolet}
              collectiviteId={collectiviteId}
              demarche={demarche}
              isReadonly={isReadonly}
              onVulnerabiliteChange={onVulnerabiliteChange}
            />
          </div>
        </TabsPanel>
      </Tabs>
    </DemarchePcaetSection>
  );
};
