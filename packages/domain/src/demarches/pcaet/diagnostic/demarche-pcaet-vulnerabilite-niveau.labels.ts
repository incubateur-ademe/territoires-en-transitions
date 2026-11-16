import type { DemarchePcaetVulnerabiliteNiveau } from './demarche-pcaet-vulnerabilite-niveau.enum.schema';

export const DEMARCHE_PCAET_VULNERABILITE_NIVEAU_LABELS = {
  non_concerne: 'non concerné',
  faible: 'faible',
  moyen: 'moyen',
  fort: 'fort',
} as const satisfies Record<DemarchePcaetVulnerabiliteNiveau, string>;
