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
import { Icon } from '@tet/ui';
import {
  Tabs,
  TabsList,
  TabsPanel,
} from '@tet/ui/design-system/TabsNext/index';
import { cn } from '@tet/ui/utils/cn';
import { useState } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';
import { VoletDiagnosticPanelContent } from './volet-diagnostic-panel-content';

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
          {DEMARCHE_PCAET_VOLETS.map((volet) => {
            const statut = getDiagnosticVoletStatut(demarche, volet.id);
            const isComplete = statut === 'complete';
            const isActive = activeVoletId === volet.id;

            return (
              <li key={volet.id} role="presentation" className="p-0">
                <button
                  type="button"
                  role="tab"
                  id={`demarche-volet-tab-${volet.id}`}
                  aria-selected={isActive}
                  aria-controls={`demarche-volet-panel-${volet.id}`}
                  onClick={() => setActiveVoletId(volet.id)}
                  className={cn(
                    'group flex w-full flex-col items-center gap-3 rounded-lg border p-4 text-center transition-colors cursor-pointer',
                    isActive
                      ? 'border-primary-5 bg-primary-0'
                      : 'border-grey-3 hover:border-primary-5 hover:bg-primary-0'
                  )}
                  data-test={`demarche-volet-${volet.id}`}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isComplete
                        ? 'bg-success-2 text-success-9'
                        : 'bg-primary-1 text-primary-9'
                    )}
                  >
                    <Icon icon={volet.icon} size="lg" />
                  </span>
                  <span className="text-sm font-semibold text-primary-9">
                    {volet.label}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isComplete ? 'text-success-8' : 'text-warning-1'
                    )}
                  >
                    {isComplete
                      ? appLabels.demarchePcaetDiagnosticVoletComplete
                      : appLabels.demarchePcaetDiagnosticVoletAComplete}
                  </span>
                </button>
              </li>
            );
          })}
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
