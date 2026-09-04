import {
  getYearFromIsoDate,
  IndicateurValeurAvecMetadonnesDefinition,
} from '../../../indicateurs';
import {
  listPcaetDiagnosticIndicateurRequiredLeaves,
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
} from './demarche-pcaet-diagnostic.config';
import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from './demarche-pcaet-diagnostic.schema';

/** Borne basse d'une année saisissable dans le diagnostic. */
export const REFERENCE_YEAR_MIN = 1990;

/**
 * Année de référence déduite des années de résultats déjà saisies : la plus récente
 * dans les bornes, hors années d'objectifs. Sans constat, le tableau reste sans
 * année de référence — c'est à la collectivité de la renseigner.
 */
export const deriveReferenceYearFromIndicateurValeurYears = ({
  resultYears,
  currentYear = new Date().getFullYear(),
  excludedYears = PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
}: {
  resultYears: readonly number[];
  currentYear?: number;
  excludedYears?: readonly number[];
}): number | null => {
  const excluded = new Set(excludedYears);
  const eligible = resultYears.filter(
    (year) =>
      year >= REFERENCE_YEAR_MIN && year <= currentYear && !excluded.has(year)
  );

  return eligible.length === 0 ? null : Math.max(...eligible);
};

/**
 * Une année de référence désigne l'année du constat : elle est révolue, dans
 * les bornes saisissables, et n'empiète pas sur un horizon d'objectif, qui a
 * sa propre colonne.
 */
export const isPcaetDiagnosticReferenceYear = (
  year: number,
  currentYear: number = new Date().getFullYear()
): boolean =>
  year >= REFERENCE_YEAR_MIN &&
  year <= currentYear &&
  !PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.includes(year);

const isLeafComplet = ({
  optionalYears,
  valeurs,
}: {
  optionalYears: readonly number[];
  valeurs: readonly IndicateurValeurAvecMetadonnesDefinition[];
}): boolean => {
  const hasReferenceResultat = valeurs.some(({ indicateurValeur }) => {
    const year = getYearFromIsoDate(indicateurValeur.dateValeur);
    return (
      isPcaetDiagnosticReferenceYear(year) && indicateurValeur.resultat !== null
    );
  });
  if (!hasReferenceResultat) {
    return false;
  }

  const requiredObjectifYears =
    PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.filter(
      (year) => !optionalYears.includes(year)
    );

  return requiredObjectifYears.every((year) =>
    valeurs.some(
      ({ indicateurValeur }) =>
        getYearFromIsoDate(indicateurValeur.dateValeur) === year &&
        indicateurValeur.objectif !== null
    )
  );
};

/**
 * Un topic indicateur est complet quand chacune de ses lignes requises porte un
 * constat et une cible : un résultat sur l'année de comptabilisation et un
 * objectif sur chaque horizon requis (hors `optionalYears`). Les années ajoutées
 * ouvrent des colonnes sans rien exiger. Un topic optionnel, ou sans aucune
 * ligne exigée, est complet — sinon il retiendrait le dossier sur une saisie
 * qu'on ne lui demande pas.
 */
export const isPcaetDiagnosticIndicateurComplet = ({
  config,
  indicateurs,
}: {
  config: PcaetDiagnosticIndicateurParentConfig;
  indicateurs: readonly IndicateurValeurAvecMetadonnesDefinition[];
}): boolean => {
  if (config.optional === true) {
    return true;
  }

  const requiredLeaves = listPcaetDiagnosticIndicateurRequiredLeaves(config);
  if (requiredLeaves.length === 0) {
    return true;
  }

  // Les valeurs sont servies pour tout le diagnostic : on indexe par
  // identifiant pour ne juger chaque feuille que sur sa propre saisie.
  const valeursByIdentifiant = new Map<
    string,
    IndicateurValeurAvecMetadonnesDefinition[]
  >();
  for (const indicateur of indicateurs) {
    const identifiant =
      indicateur.indicateurDefinition?.identifiantReferentiel ?? '';
    if (identifiant.length === 0) {
      continue;
    }
    const bucket = valeursByIdentifiant.get(identifiant) ?? [];
    bucket.push(indicateur);
    valeursByIdentifiant.set(identifiant, bucket);
  }

  return requiredLeaves.every((leaf) =>
    isLeafComplet({
      optionalYears: leaf.optionalYears,
      valeurs: valeursByIdentifiant.get(leaf.indicateurDefinitionId) ?? [],
    })
  );
};

/**
 * Complétude de l'étape diagnostic du dossier, condition de la transmission
 * pour avis. Seuls comptent les topics indicateurs qui exigent quelque chose :
 * le front et le guard serveur appliquent cette règle au même objet, ils ne
 * peuvent donc pas rendre deux verdicts. La vulnérabilité n'entre pas dans le
 * calcul.
 */
export const isDemarchePcaetDiagnosticComplet = (
  diagnostic: PcaetDiagnostic
): boolean =>
  diagnostic.indicateurParentConfigs.length > 0 &&
  diagnostic.indicateurParentConfigs.every((config) =>
    isPcaetDiagnosticIndicateurComplet({
      config,
      indicateurs: diagnostic.indicateurValeurs,
    })
  );
