import type { PcaetDiagnostic } from '@tet/domain/demarches';

/** Onglet du diagnostic : un parent indicateur, ou la vulnérabilité. */
export type DiagnosticTab = {
  code: string;
  label: string;
  icon: string;
};

export const isVulnerabiliteTab = (
  tab: DiagnosticTab,
  vulnerabiliteCode: string
): boolean => tab.code === vulnerabiliteCode;

/**
 * Un onglet par élément de `indicateurParentConfigs`, puis la vulnérabilité.
 * L’ordre réglementaire est celui du tableau de config.
 */
export const listDiagnosticTabs = (
  diagnostic: PcaetDiagnostic
): DiagnosticTab[] => [
  ...diagnostic.indicateurParentConfigs.map(({ code, label, icon }) => ({
    code,
    label,
    icon,
  })),
  {
    code: diagnostic.vulnerabilite.code,
    label: diagnostic.vulnerabilite.label,
    icon: diagnostic.vulnerabilite.icon,
  },
];
