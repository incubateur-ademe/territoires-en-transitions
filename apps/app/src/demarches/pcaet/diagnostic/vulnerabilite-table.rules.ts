import { appLabels } from '@/app/labels/catalog';
import type {
  DemarchePcaetVulnerabilite,
  DemarchePcaetVulnerabiliteThematique,
  DemarchePcaetVulnerabiliteHorizon,
  DemarchePcaetVulnerabiliteLigne,
} from '@tet/domain/demarches';

export type NiveauColumn = {
  horizon: DemarchePcaetVulnerabiliteHorizon;
  key: 'niveauMaintenant' | 'niveau2050' | 'niveau2100';
  label: string;
};

export const NIVEAU_COLUMNS: readonly NiveauColumn[] = [
  {
    horizon: 'maintenant',
    key: 'niveauMaintenant',
    label: appLabels.demarcheVulnerabiliteDiagMaintenant,
  },
  {
    horizon: '2050',
    key: 'niveau2050',
    label: appLabels.demarcheVulnerabiliteDiag2050,
  },
  {
    horizon: '2100',
    key: 'niveau2100',
    label: appLabels.demarcheVulnerabiliteDiag2100,
  },
];

export type ObjectifColumn = {
  key: 'objectifs2050' | 'objectifs2100';
  horizon: string;
  label: string;
};

export const OBJECTIF_COLUMNS: readonly ObjectifColumn[] = [
  {
    key: 'objectifs2050',
    horizon: '2050',
    label: appLabels.demarcheVulnerabiliteObjectifs2050,
  },
  {
    key: 'objectifs2100',
    horizon: '2100',
    label: appLabels.demarcheVulnerabiliteObjectifs2100,
  },
];

export type VulnerabiliteRow = {
  thematique: DemarchePcaetVulnerabiliteThematique;
  ligne: DemarchePcaetVulnerabiliteLigne;
};

const ligneVierge = (thematiqueId: number): DemarchePcaetVulnerabiliteLigne => ({
  thematiqueId,
  niveauMaintenant: null,
  niveau2050: null,
  niveau2100: null,
  objectifs2050: null,
  objectifs2100: null,
});

/**
 * Lignes du tableau : l'ordre des thématiques fait foi, et une thématique sans saisie
 * reçoit une ligne vierge. Le serveur en sert déjà une, mais une photo figée
 * par une version antérieure peut ne pas la porter — le tableau ne doit pas
 * perdre une ligne pour autant.
 */
export const toVulnerabiliteRows = (
  vulnerabilite: DemarchePcaetVulnerabilite
): VulnerabiliteRow[] => {
  const parThematique = new Map(
    vulnerabilite.lignes.map((ligne) => [ligne.thematiqueId, ligne])
  );
  return vulnerabilite.thematiques.map((thematique) => ({
    thematique,
    ligne: parThematique.get(thematique.id) ?? ligneVierge(thematique.id),
  }));
};
