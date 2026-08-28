import {
  getYearFromIsoDate,
  IndicateurValeurAvecMetadonnesDefinition,
} from '../../../indicateurs';
import {
  listPcaetDiagnosticIndicateurDefinitionIds,
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
 * Un topic indicateur est complet quand chacune de ses lignes requises porte un
 * constat et une cible : un résultat sur l'année de comptabilisation et un
 * objectif sur au moins un horizon. Les années ajoutées ouvrent des colonnes
 * sans rien exiger. Un topic qui n'exige rien est complet, faute de quoi il
 * retiendrait le dossier sur une saisie qu'on ne lui demande pas — voir
 * `isDemarchePcaetIndicateurTopicOptional`, qui décide de l'affichage de ces
 * volets.
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

  // Les valeurs sont servies pour tout le diagnostic : sans ce filtrage, la
  // saisie d'un volet suffirait à déclarer les autres complets.
  const definitionIds = new Set(
    listPcaetDiagnosticIndicateurDefinitionIds(config)
  );
  const saisieYears = new Set(
    indicateurs
      .filter(({ indicateurDefinition }) =>
        definitionIds.has(indicateurDefinition?.identifiantReferentiel ?? '')
      )
      .map(({ indicateurValeur }) =>
        getYearFromIsoDate(indicateurValeur.dateValeur)
      )
  );

  return PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.every((year) =>
    saisieYears.has(year)
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
