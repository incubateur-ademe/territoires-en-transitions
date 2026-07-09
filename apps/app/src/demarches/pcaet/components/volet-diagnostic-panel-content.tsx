'use client';

import type { DemarchePcaetVoletConfig } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type {
  DemarchePcaet,
  DemarchePcaetVulnerabiliteState,
} from '@/app/demarches/pcaet/demarche-pcaet.types';
import { VoletGridView } from '@/app/demarches/pcaet/indicateurs-grid/volet-grid.view';
import { VOLET_GRID_SHAPES } from '@/app/demarches/pcaet/indicateurs-grid/volet-grid-shapes';
import { appLabels } from '@/app/labels/catalog';
import Link from 'next/link';
import { VulnerabiliteTable } from './vulnerabilite-table';
import { VoletIndicateurModalContent } from './volet-indicateur-modal-content';

type Props = {
  volet: DemarchePcaetVoletConfig;
  collectiviteId: number;
  demarche: DemarchePcaet;
  isReadonly?: boolean;
  onVulnerabiliteChange: (
    vulnerabilite: DemarchePcaetVulnerabiliteState
  ) => void;
};

export const VoletDiagnosticPanelContent = ({
  volet,
  collectiviteId,
  demarche,
  isReadonly = false,
  onVulnerabiliteChange,
}: Props) => {
  const gridShape = VOLET_GRID_SHAPES[volet.id];
  if (gridShape) {
    return (
      <VoletGridView
        demarcheId={demarche.id}
        voletId={volet.id}
        shape={gridShape}
      />
    );
  }

  if (volet.id === 'vulnerabilite_territoire') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-primary-9 m-0">
          {appLabels.demarchePcaetVulnerabiliteDescription}
        </p>
        <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
          <VulnerabiliteTable
            value={demarche.vulnerabilite}
            isReadonly={isReadonly}
            onChange={onVulnerabiliteChange}
          />
        </div>
      </div>
    );
  }

  if (!volet.indicateurIdentifiantReferentiel) {
    return (
      <p className="text-sm text-grey-7">
        {appLabels.demarchePcaetVoletModalAucunIndicateur}{' '}
        <Link
          href={volet.href(collectiviteId, demarche.id)}
          className="text-primary-8 underline"
        >
          {appLabels.demarchePcaetVoletModalAccederPage}
        </Link>
      </p>
    );
  }

  return (
    <VoletIndicateurModalContent
      collectiviteId={collectiviteId}
      indicateurIdentifiantReferentiel={volet.indicateurIdentifiantReferentiel}
      voletLabel={volet.label}
      isReadonly={isReadonly}
    />
  );
};
