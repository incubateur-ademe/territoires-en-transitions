'use client';

import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
  PcaetDiagnosticVulnerabilite,
} from '@tet/domain/demarches';
import { DiagnosticIndicateurTabContent } from './indicateurs-grid/diagnostic.indicateur.tab-content';
import { DiagnosticVulnerabiliteTab } from './indicateurs-grid/diagnostic.vulnerabilite.tab';

type Props = {
  config: PcaetDiagnosticIndicateurParentConfig | null;
  vulnerabilite: PcaetDiagnosticVulnerabilite | null;
  definitions: PcaetDiagnostic['indicateurDefinitions'];
  valeurs: PcaetDiagnostic['indicateurValeurs'];
  demarcheId: number;
  isReadonly: boolean;
};

export const DiagnosticTabContent = ({
  config,
  vulnerabilite,
  definitions,
  valeurs,
  demarcheId,
  isReadonly,
}: Props) => {
  if (vulnerabilite !== null) {
    return (
      <DiagnosticVulnerabiliteTab
        demarcheId={demarcheId}
        isReadonly={isReadonly}
        vulnerabilite={vulnerabilite}
      />
    );
  }

  if (config === null) {
    return null;
  }

  return (
    <DiagnosticIndicateurTabContent
      demarcheId={demarcheId}
      config={config}
      definitions={definitions}
      valeurs={valeurs}
      isReadonly={isReadonly}
    />
  );
};
