'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  buildPcaetDiagnosticIndicateurTables,
  type PcaetDiagnostic,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { Fragment, JSX, useMemo } from 'react';
import { DiagnosticIndicateurValeursTable } from './diagnostic.indicateur-valeurs.table';
import { attachIndicateurDataToTables } from './indicateur-tab.layout';

type Props = {
  demarcheId: number;
  config: PcaetDiagnosticIndicateurParentConfig;
  indicateurs: PcaetDiagnostic['indicateurDefinitions'];
  valeurs: PcaetDiagnostic['indicateurValeurs'];
  isReadonly: boolean;
  showDescription: boolean;
};

export const DiagnosticIndicateurTabContent = ({
  demarcheId,
  config,
  indicateurs,
  valeurs,
  isReadonly,
  showDescription,
}: Props): JSX.Element => {
  const tables = useMemo(
    () =>
      attachIndicateurDataToTables(
        buildPcaetDiagnosticIndicateurTables(config),
        {
          indicateurs,
          valeurs,
        }
      ),
    [config, indicateurs, valeurs]
  );

  const descriptions: Partial<Record<string, string>> =
    appLabels.demarcheDiagnosticIndicateurDescriptions;
  const description = descriptions[config.code];

  return (
    <div className="flex flex-col gap-8">
      {showDescription && description !== undefined && (
        <p className="text-sm text-primary-9 m-0">{description}</p>
      )}
      {tables.map((table, index) => (
        <Fragment key={table.id}>
          {table.section !== null &&
          table.section !== tables[index - 1]?.section ? (
            <h3 className="text-lg font-bold text-primary-9 m-0">
              {table.section}
            </h3>
          ) : null}
          <DiagnosticIndicateurValeursTable
            demarcheId={demarcheId}
            table={table}
            isReadonly={isReadonly}
            maxHeight={tables.length === 1 ? 'viewport' : 'compact'}
          />
        </Fragment>
      ))}
    </div>
  );
};
