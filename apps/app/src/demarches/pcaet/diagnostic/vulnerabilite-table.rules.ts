import { appLabels } from '@/app/labels/catalog';
import type {
  DemarchePcaetVulnerabilite,
  DemarchePcaetVulnerabiliteDomaine,
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
  domaine: DemarchePcaetVulnerabiliteDomaine;
  ligne: DemarchePcaetVulnerabiliteLigne;
};

const ligneVierge = (domaineId: number): DemarchePcaetVulnerabiliteLigne => ({
  domaineId,
  niveauMaintenant: null,
  niveau2050: null,
  niveau2100: null,
  objectifs2050: null,
  objectifs2100: null,
});

/**
 * Lignes du tableau : l'ordre des domaines fait foi, et un domaine sans saisie
 * reçoit une ligne vierge. Le serveur en sert déjà une, mais une photo figée
 * par une version antérieure peut ne pas la porter — le tableau ne doit pas
 * perdre une ligne pour autant.
 */
export const toVulnerabiliteRows = (
  vulnerabilite: DemarchePcaetVulnerabilite
): VulnerabiliteRow[] => {
  const parDomaine = new Map(
    vulnerabilite.lignes.map((ligne) => [ligne.domaineId, ligne])
  );
  return vulnerabilite.domaines.map((domaine) => ({
    domaine,
    ligne: parDomaine.get(domaine.id) ?? ligneVierge(domaine.id),
  }));
};
