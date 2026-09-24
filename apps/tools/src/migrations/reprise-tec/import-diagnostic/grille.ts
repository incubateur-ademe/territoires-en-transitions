/**
 * La grille : où se range un chiffre de T&C dans le diagnostic de TeT, sa ligne et sa colonne.
 * La ligne : numéro T&C → nom de la ligne à l'écran (tables ci-dessous) → code `cae_*` lu dans la grille de l'app.
 */

import {
  isPcaetDiagnosticReferenceYear,
  PCAET_DIAGNOSTIC_INDICATEURS,
} from '@tet/domain/demarches';
import type { LigneDiagnostic } from './diagnostic';

export type Emplacement = {
  identifiant: string;
  annee: number;
  champ: 'resultat' | 'objectif';
};

/** Règle : l'emplacement d'une ligne de T&C dans la grille ; aucun s'il lui manque la ligne ou la colonne. */
export const getEmplacement = (l: LigneDiagnostic): Emplacement | null => {
  const identifiant = getLigne(l);
  const colonne = getColonne(l.periode, l.annee);
  return identifiant !== null && colonne !== null
    ? { identifiant, ...colonne }
    : null;
};

// ---------------------------------------------------------------------------
// La ligne : sur quelle ligne de la grille va une ligne de T&C.
// ---------------------------------------------------------------------------

const SECTEURS = new Map<number | null, string>([
  [1, 'Résidentiel'],
  [2, 'Tertiaire'],
  [3, 'Transport routier'],
  [4, 'Autres transports'],
  [5, 'Agriculture'],
  [6, 'Déchets'],
  [7, 'Industrie hors branche énergie'],
  [8, 'Industrie branche énergie'],
]);

const POLLUANTS = new Map<number | null, string>([
  [1, 'PM10'],
  [2, 'PM2.5'],
  [3, 'NOx'],
  [4, 'SO2'],
  [5, 'COVNM'],
  [6, 'NH3'],
]);

const SOLS = new Map<number | null, string>([
  [1, 'Forêt'],
  [2, 'Sols agricoles (terres cultivées et prairies)'],
  [3, 'Autres sols'],
]);

const FILIERES = new Map<
  number | null,
  { vecteur: string; libelle: string } | null
>([
  [1, { vecteur: 'electricité', libelle: 'Éolien terrestre' }],
  [2, { vecteur: 'electricité', libelle: 'Solaire photovoltaïque' }],
  [3, null], // Solaire thermodynamique : aucun indicateur
  [4, null], // Hydraulique : crte_3.2, hors grille, en attente d'une ligne dans l'onglet EnR
  [5, { vecteur: 'electricité', libelle: 'Biomasse solide' }],
  [6, { vecteur: 'electricité', libelle: 'Biogaz' }],
  [7, null], // Géothermie électrique : aucun indicateur
  [8, { vecteur: 'chaleur', libelle: 'Biomasse solide' }],
  [9, null], // Pompes à chaleur : cae_3.al, hors grille, en attente d'une ligne dans l'onglet EnR
  [10, { vecteur: 'chaleur', libelle: 'Géothermie' }],
  [11, { vecteur: 'chaleur', libelle: 'Solaire thermique' }],
  [12, { vecteur: 'chaleur', libelle: 'Biogaz' }],
  [13, null], // Biométhane : cae_3.c, hors grille
  [14, null], // Biocarburants : aucun indicateur
]);

/** Règle : la ligne de la grille (`cae_*`) d'une ligne de T&C ; aucune si son numéro est inconnu ou sa filière sans ligne. */
const getLigne = (l: LigneDiagnostic): string | null => {
  switch (l.table) {
    case 'demarche_emission_ges':
      return findIdentifiant('emissions_ges', [SECTEURS.get(l.secteur)]);
    case 'demarche_consommation':
      return findIdentifiant('consommation_energetique', [
        SECTEURS.get(l.secteur),
      ]);
    case 'demarche_polluants':
      return findIdentifiant('polluants_atmospheriques', [
        POLLUANTS.get(l.polluant),
        SECTEURS.get(l.secteur),
      ]);
    case 'demarche_polluant_total':
      return findIdentifiant('polluants_atmospheriques', [
        POLLUANTS.get(l.polluant),
      ]);
    case 'demarche_sequestration_estimation':
      return findIdentifiant('sequestration', [SOLS.get(l.sol)]);
    case 'demarche_enr_prod_et_conso': {
      const filiere = FILIERES.get(l.filiere);
      return filiere
        ? findIdentifiant('enr', [filiere.libelle], filiere.vecteur)
        : null;
    }
  }
};

type LigneGrille = {
  label: string;
  indicateurDefinitionId: string;
  groupBy?: string;
  children?: readonly LigneGrille[];
};

/** Descend dans un volet de la grille, nom après nom, et rend le code trouvé ; arrête si un nom n'y est pas. */
const findIdentifiant = (
  volet: string,
  libelles: (string | undefined)[],
  vecteur?: string
): string | null => {
  if (libelles.some((libelle) => libelle === undefined)) {
    return null;
  }
  let lignes: readonly LigneGrille[] | undefined =
    PCAET_DIAGNOSTIC_INDICATEURS.find((v) => v.code === volet)?.children;
  let ligne: LigneGrille | undefined;
  for (const libelle of libelles) {
    ligne = lignes?.find(
      (l) =>
        l.label === libelle && (vecteur === undefined || l.groupBy === vecteur)
    );
    lignes = ligne?.children;
  }
  if (!ligne) {
    throw new Error(
      `Ligne « ${libelles.join(
        ' / '
      )} » introuvable dans le volet ${volet} de la grille : la grille a changé.`
    );
  }
  return ligne.indicateurDefinitionId;
};

// ---------------------------------------------------------------------------
// La colonne : dans quelle colonne de la grille va une ligne de T&C.
// ---------------------------------------------------------------------------

/** Règle : la colonne d'une période T&C ; les objectifs 2021 et 2026 n'en ont pas ; un constat n'en a une que si le domaine accepte son année. */
const getColonne = (
  periode: number | null,
  annee: number | null
): Pick<Emplacement, 'annee' | 'champ'> | null => {
  switch (periode) {
    case 1:
      return annee !== null && isPcaetDiagnosticReferenceYear(annee)
        ? { annee, champ: 'resultat' }
        : null;
    case 4:
    case 6:
      return { annee: 2030, champ: 'objectif' };
    case 5:
    case 7:
      return { annee: 2050, champ: 'objectif' };
    default:
      return null;
  }
};
