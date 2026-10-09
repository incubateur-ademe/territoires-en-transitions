'use client';

import { appLabels } from '@/app/labels/catalog';
import { useAutosaveStatus } from '@/app/utils/react-query/autosave-status/use-autosave-status';
import type { PcaetDiagnosticVulnerabilite } from '@tet/domain/demarches';
import { AutosaveBadge } from '@tet/ui';
import { JSX } from 'react';
import { demarchePcaetAutosaveKeys } from '../../data/autosave-keys';
import { VulnerabiliteTable } from '../vulnerabilite-table';

type Props = {
  demarcheId: number;
  isReadonly: boolean;
  vulnerabilite: PcaetDiagnosticVulnerabilite;
};

export const DiagnosticVulnerabiliteTab = ({
  demarcheId,
  isReadonly,
  vulnerabilite,
}: Props): JSX.Element => {
  const autosaveStatus = useAutosaveStatus(
    demarchePcaetAutosaveKeys.diagnosticVulnerabilite(demarcheId)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-primary-9 m-0">
          {appLabels.demarcheVulnerabiliteDescription}
        </p>
        {!isReadonly && (
          <AutosaveBadge
            status={autosaveStatus}
            dataTest="demarches.pcaet.diagnostic.vulnerabilite.autosave"
          />
        )}
      </div>
      <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
        <VulnerabiliteTable
          vulnerabilite={{
            thematiques: vulnerabilite.thematiques,
            lignes: vulnerabilite.lignes,
          }}
          demarcheId={demarcheId}
          isReadonly={isReadonly}
        />
      </div>
    </div>
  );
};
