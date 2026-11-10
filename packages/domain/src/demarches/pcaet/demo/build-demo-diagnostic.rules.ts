import { PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS } from '../diagnostic/demarche-pcaet-diagnostic.config';
import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from '../diagnostic/demarche-pcaet-diagnostic.schema';
import {
  DemarchePcaetVulnerabiliteNiveauEnum,
  type DemarchePcaetVulnerabiliteNiveau,
} from '../diagnostic/demarche-pcaet-vulnerabilite-niveau.enum.schema';
import type { DemarchePcaetVulnerabiliteLigne } from '../diagnostic/demarche-pcaet-vulnerabilite.schema';

export type DemoDiagnosticValeur = {
  indicateurId: number;
  year: number;
  field: 'resultat' | 'objectif';
  value: number;
};

export type DemoDiagnostic = {
  valeurs: DemoDiagnosticValeur[];
  vulnerabilite: DemarchePcaetVulnerabiliteLigne[];
};

/**
 * Ordre de grandeur d'une ligne à l'année de référence, et part qui en reste
 * à chaque horizon d'objectif (2030, 2036, 2050) : les émissions et les
 * consommations baissent, la séquestration et les EnR montent.
 */
const TRAJECTOIRES: Record<
  string,
  { min: number; max: number; facteurs: readonly [number, number, number] }
> = {
  emissions_ges: { min: 15, max: 120, facteurs: [0.6, 0.45, 0.15] },
  polluants_atmospheriques: { min: 5, max: 150, facteurs: [0.7, 0.55, 0.35] },
  sequestration: { min: 5, max: 60, facteurs: [1.1, 1.2, 1.4] },
  consommation_energetique: { min: 50, max: 400, facteurs: [0.8, 0.7, 0.5] },
  enr: { min: 1, max: 40, facteurs: [1.8, 2.5, 4] },
};

const TRAJECTOIRE_PAR_DEFAUT = TRAJECTOIRES.emissions_ges;

/**
 * Pseudo-aléa stable par identifiant (FNV-1a) : deux remplissages donnent les
 * mêmes chiffres, et deux lignes voisines (`cae_1.c`, `cae_1.d`) des chiffres
 * bien distincts.
 */
const seed = (identifiant: string): number => {
  let hash = 0x811c9dc5;
  for (const char of identifiant) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash / 0xffffffff;
};

const round = (value: number): number => Math.round(value * 10) / 10;

/** Feuilles saisissables d'un volet, facultatives comprises : la démo montre une grille pleine. */
const listLeafIdentifiants = (
  config: PcaetDiagnosticIndicateurParentConfig
): string[] =>
  config.children.flatMap((child) =>
    child.children !== undefined && child.children.length > 0
      ? child.children.map((leaf) => leaf.indicateurDefinitionId)
      : [child.indicateurDefinitionId]
  );

const NIVEAUX_GRADUES: readonly DemarchePcaetVulnerabiliteNiveau[] = [
  DemarchePcaetVulnerabiliteNiveauEnum.FAIBLE,
  DemarchePcaetVulnerabiliteNiveauEnum.MOYEN,
  DemarchePcaetVulnerabiliteNiveauEnum.FORT,
];

const aggrave = (
  niveau: DemarchePcaetVulnerabiliteNiveau
): DemarchePcaetVulnerabiliteNiveau =>
  NIVEAUX_GRADUES[
    Math.min(NIVEAUX_GRADUES.indexOf(niveau) + 1, NIVEAUX_GRADUES.length - 1)
  ];

/**
 * Diagnostic de démonstration : un constat sur l'année courante et une
 * trajectoire plausible aux horizons exigés pour chaque ligne du référentiel
 * que la collectivité connaît, et une vulnérabilité qui s'aggrave avec le
 * temps pour chaque thématique requise. Le résultat satisfait les règles de
 * complétude réelles : rien n'est contourné, tout est saisi.
 */
export const buildDemoDiagnostic = (
  diagnostic: Pick<
    PcaetDiagnostic,
    'indicateurParentConfigs' | 'indicateurDefinitions' | 'vulnerabilite'
  >,
  currentYear: number = new Date().getFullYear()
): DemoDiagnostic => {
  const idByIdentifiant = new Map<string, number>();
  for (const definition of diagnostic.indicateurDefinitions) {
    if (definition.identifiantReferentiel !== null) {
      idByIdentifiant.set(definition.identifiantReferentiel, definition.id);
    }
  }

  // L'année de référence ne peut pas tomber sur un horizon d'objectif, qui a
  // sa propre colonne : en 2030, le constat se fait sur 2029.
  const referenceYear =
    PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.includes(currentYear)
      ? currentYear - 1
      : currentYear;

  const valeurs: DemoDiagnosticValeur[] = [];
  for (const config of diagnostic.indicateurParentConfigs) {
    const { min, max, facteurs } =
      TRAJECTOIRES[config.code] ?? TRAJECTOIRE_PAR_DEFAUT;
    for (const identifiant of listLeafIdentifiants(config)) {
      const indicateurId = idByIdentifiant.get(identifiant);
      if (indicateurId === undefined) {
        continue;
      }
      const reference = round(min + seed(identifiant) * (max - min));
      valeurs.push({
        indicateurId,
        year: referenceYear,
        field: 'resultat',
        value: reference,
      });
      PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.forEach(
        (year, index) => {
          valeurs.push({
            indicateurId,
            year,
            field: 'objectif',
            value: round(reference * (facteurs[index] ?? 1)),
          });
        }
      );
    }
  }

  const vulnerabilite = diagnostic.vulnerabilite.thematiques
    .filter((thematique) => thematique.requis)
    .map((thematique, index): DemarchePcaetVulnerabiliteLigne => {
      const niveauMaintenant = NIVEAUX_GRADUES[index % 2];
      const niveau2050 = aggrave(niveauMaintenant);
      const niveau2100 = aggrave(niveau2050);
      return {
        thematiqueId: thematique.id,
        niveauMaintenant,
        niveau2050,
        niveau2100,
        objectifs2050: `Réduire l'exposition du territoire (${thematique.label}) et adapter les aménagements d'ici 2050.`,
        objectifs2100: `Garantir la résilience du territoire (${thematique.label}) à l'horizon 2100.`,
      };
    });

  return { valeurs, vulnerabilite };
};
