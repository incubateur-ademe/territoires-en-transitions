'use client';

import { appLabels } from '@/app/labels/catalog';
import type { PcaetDiagnosticVulnerabilite } from '@tet/domain/demarches';
import { JSX } from 'react';
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
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-primary-9 m-0">
        {appLabels.demarcheVulnerabiliteDescription}
      </p>
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
