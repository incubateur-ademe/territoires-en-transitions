'use client';

import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { Fragment, JSX, useMemo } from 'react';
import { DiagnosticIndicateurValeursTable } from './diagnostic.indicateur-valeurs.table';
import {
  attachIndicateurDataToTables,
  buildIndicateurValeursTables,
} from './indicateur-tab.layout';

type Props = {
  demarcheId: number;
  config: PcaetDiagnosticIndicateurParentConfig;
  definitions: PcaetDiagnostic['indicateurDefinitions'];
  valeurs: PcaetDiagnostic['indicateurValeurs'];
  isReadonly: boolean;
};

export const DiagnosticIndicateurTabContent = ({
  demarcheId,
  config,
  definitions,
  valeurs,
  isReadonly,
}: Props): JSX.Element => {
  const tables = useMemo(
    () =>
      attachIndicateurDataToTables(buildIndicateurValeursTables(config), {
        definitions,
        valeurs,
      }),
    [config, definitions, valeurs]
  );

  return (
    <div className="flex flex-col gap-8">
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
