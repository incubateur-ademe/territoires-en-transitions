'use client';

import {
  DEMARCHE_PCAET_VOLETS,
  type DemarchePcaetVoletConfig,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type {
  DemarchePcaet,
  DemarchePcaetVoletId,
} from '@/app/demarches/pcaet/demarche-pcaet.types';
import {
  makeCollectiviteDemarchePcaetPolluantsUrl,
  makeCollectiviteDemarchePcaetVulnerabiliteUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';
import { VoletDiagnosticModal } from './volet-diagnostic-modal';

type Props = {
  collectiviteId: number;
  demarche: DemarchePcaet;
  isReadonly?: boolean;
  onDocumentsChange: (documents: DemarchePcaet['documents']) => void;
  status?: 'complete' | 'incomplete';
};

export const DiagnosticVoletsSection = ({
  collectiviteId,
  demarche,
  isReadonly = false,
  onDocumentsChange,
  status,
}: Props) => {
  const router = useRouter();
  const [openVolet, setOpenVolet] = useState<DemarchePcaetVoletConfig | null>(
    null
  );

  const openVoletModal = (voletId: DemarchePcaetVoletId) => {
    const volet = DEMARCHE_PCAET_VOLETS.find((v) => v.id === voletId);
    if (volet) {
      setOpenVolet(volet);
    }
  };

  const handleVoletClick = (voletId: DemarchePcaetVoletId): void => {
    if (voletId === 'polluants_atmospheriques') {
      router.push(makeCollectiviteDemarchePcaetPolluantsUrl({ collectiviteId }));
      return;
    }
    if (voletId === 'vulnerabilite_territoire') {
      router.push(
        makeCollectiviteDemarchePcaetVulnerabiliteUrl({
          collectiviteId,
          demarchePcaetId: demarche.id,
        })
      );
      return;
    }
    openVoletModal(voletId);
  };

  return (
    <>
      <DemarchePcaetSection
        title={appLabels.demarchePcaetDiagnosticTitre}
        description={appLabels.demarchePcaetDiagnosticDescription}
        status={status}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {DEMARCHE_PCAET_VOLETS.map((volet) => {
            const statut = demarche.volets[volet.id];
            const isComplete = statut === 'complete';

            return (
              <button
                key={volet.id}
                type="button"
                onClick={() => handleVoletClick(volet.id)}
                className="group flex flex-col items-center gap-3 rounded-lg border border-grey-3 p-4 text-center hover:border-primary-5 hover:bg-primary-0 transition-colors cursor-pointer"
                data-test={`demarche-volet-${volet.id}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isComplete
                      ? 'bg-success-2 text-success-9'
                      : 'bg-primary-1 text-primary-9'
                  }`}
                >
                  <Icon icon={volet.icon} size="lg" />
                </span>
                <span className="text-sm font-semibold text-primary-9">
                  {volet.label}
                </span>
                <span className={`text-xs font-medium ${isComplete ? 'text-success-8' : 'text-warning-1'}`}>
                  {isComplete
                    ? appLabels.demarchePcaetDiagnosticVoletComplete
                    : appLabels.demarchePcaetDiagnosticVoletAComplete}
                </span>
              </button>
            );
          })}
        </div>
      </DemarchePcaetSection>

      <VoletDiagnosticModal
        volet={openVolet}
        collectiviteId={collectiviteId}
        isReadonly={isReadonly}
        documents={demarche.documents}
        onDocumentsChange={onDocumentsChange}
        onClose={() => setOpenVolet(null)}
      />
    </>
  );
};
