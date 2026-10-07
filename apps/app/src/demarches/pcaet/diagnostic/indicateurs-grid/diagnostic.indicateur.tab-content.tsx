'use client';

import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { capitalize } from '@tet/ui/labels/plural';
import { JSX, useMemo } from 'react';
import { DiagnosticIndicateurValeursTable } from './diagnostic.indicateur-valeurs.table';
import {
  attachIndicateurDataToSections,
  buildIndicateurValeursTableSections,
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
  const sections = useMemo(
    () =>
      attachIndicateurDataToSections(
        buildIndicateurValeursTableSections(config),
        { definitions, valeurs }
      ),
    [config, definitions, valeurs]
  );

  const isSingleTable =
    sections.length === 1 && sections[0].tables.length === 1;

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.label ?? config.code} className="flex flex-col gap-6">
          {section.label !== null ? (
            <h3 className="text-lg font-bold text-primary-9 m-0">
              {capitalize(section.label)}
            </h3>
          ) : null}
          {section.tables.map((table) => (
            <DiagnosticIndicateurValeursTable
              key={table.id}
              demarcheId={demarcheId}
              table={table}
              isReadonly={isReadonly}
              maxHeight={isSingleTable ? 'viewport' : 'compact'}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
