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
  indicateurs: PcaetDiagnostic['indicateurDefinitions'];
  valeurs: PcaetDiagnostic['indicateurValeurs'];
  demarcheId: number;
  isReadonly: boolean;
  showDescription: boolean;
};

export const DiagnosticTabContent = ({
  config,
  vulnerabilite,
  indicateurs,
  valeurs,
  demarcheId,
  isReadonly,
  showDescription,
}: Props) => {
  if (vulnerabilite !== null) {
    return (
      <DiagnosticVulnerabiliteTab
        demarcheId={demarcheId}
        isReadonly={isReadonly}
        showDescription={showDescription}
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
      indicateurs={indicateurs}
      valeurs={valeurs}
      isReadonly={isReadonly}
      showDescription={showDescription}
    />
  );
};
