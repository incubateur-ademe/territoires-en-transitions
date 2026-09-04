import { describe, expect, it } from 'vitest';
import { PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS } from './demarche-pcaet-diagnostic.config';
import {
  deriveReferenceYearFromIndicateurValeurYears,
  isDemarchePcaetDiagnosticComplet,
  isPcaetDiagnosticIndicateurComplet,
  isPcaetDiagnosticReferenceYear,
  REFERENCE_YEAR_MIN,
} from './demarche-pcaet-diagnostic.rules';
import type {
  PcaetDiagnostic,
  PcaetDiagnosticIndicateurParentConfig,
} from './demarche-pcaet-diagnostic.schema';

const parentConfig = (
  overrides: Partial<PcaetDiagnosticIndicateurParentConfig> = {}
): PcaetDiagnosticIndicateurParentConfig => ({
  code: 'emissions_ges',
  label: 'Émissions GES',
  icon: 'fire-line',
  indicateurDefinitionId: 'cae_1.a',
  referenceYearApplyLevel: 'parent',
  children: [
    {
      label: 'Résidentiel',
      indicateurDefinitionId: 'cae_1.c',
      optionalYears: [2050],
    },
  ],
  ...overrides,
});

const valeur = (
  year: number,
  identifiantReferentiel = 'cae_1.c'
): PcaetDiagnostic['indicateurValeurs'][number] =>
  ({
    indicateurValeur: {
      indicateurId: 1,
      dateValeur: `${year}-01-01`,
      resultat: null,
      objectif: null,
    },
    indicateurDefinition: { identifiantReferentiel },
  }) as PcaetDiagnostic['indicateurValeurs'][number];

/** Une valeur par horizon d'objectif requis — le minimum pour un topic non optionnel. */
const valeursCompletes = (): PcaetDiagnostic['indicateurValeurs'] =>
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.map((year) =>
    valeur(year)
  );

const vulnerabiliteTopic = (): PcaetDiagnostic['vulnerabilite'] => ({
  code: 'vulnerabilite_territoire',
  label: 'Vulnérabilité du territoire',
  icon: 'map-2-line',
  horizons: [2050, 2100],
  thematiques: [],
  lignes: [],
});

const diagnostic = (
  overrides: Partial<PcaetDiagnostic> = {}
): PcaetDiagnostic => ({
  indicateurParentConfigs: [parentConfig()],
  indicateurDefinitions: [],
  indicateurValeurs: valeursCompletes(),
  vulnerabilite: vulnerabiliteTopic(),
  ...overrides,
});

describe('deriveReferenceYearFromIndicateurValeurYears', () => {
  it('retient la plus récente année de résultat dans les bornes', () => {
    expect(
      deriveReferenceYearFromIndicateurValeurYears({
        resultYears: [2015, 2021, 2019],
        currentYear: 2026,
      })
    ).toBe(2021);
  });

  it('exclut les horizons d’objectif et les années hors bornes', () => {
    expect(
      deriveReferenceYearFromIndicateurValeurYears({
        resultYears: [
          REFERENCE_YEAR_MIN - 1,
          2030,
          2036,
          2050,
          2027,
        ],
        currentYear: 2026,
      })
    ).toBeNull();
  });

  it('renvoie null sans année de résultat éligible', () => {
    expect(
      deriveReferenceYearFromIndicateurValeurYears({
        resultYears: [],
        currentYear: 2026,
      })
    ).toBeNull();
  });
});

describe('isPcaetDiagnosticReferenceYear', () => {
  it('accepte une année révolue dans les bornes', () => {
    expect(isPcaetDiagnosticReferenceYear(2021, 2026)).toBe(true);
  });

  it('refuse une année à venir ou sous la borne basse', () => {
    expect(isPcaetDiagnosticReferenceYear(2027, 2026)).toBe(false);
    expect(isPcaetDiagnosticReferenceYear(REFERENCE_YEAR_MIN - 1, 2026)).toBe(
      false
    );
  });

  it('refuse un horizon d’objectif, qui a sa propre colonne', () => {
    expect(isPcaetDiagnosticReferenceYear(2030, 2036)).toBe(false);
  });
});

describe('isPcaetDiagnosticIndicateurComplet', () => {
  it('exige une valeur sur chaque horizon d’objectif requis', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: valeursCompletes(),
      })
    ).toBe(true);
  });

  it('échoue dès qu’un horizon requis manque', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: [valeur(2030), valeur(2036)],
      })
    ).toBe(false);
  });

  it('ignore les valeurs saisies sur les indicateurs d’un autre topic', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.map(
          (year) => valeur(year, 'cae_2.e')
        ),
      })
    ).toBe(false);
  });

  it('accepte une saisie portée par l’indicateur parent', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.map(
          (year) => valeur(year, 'cae_1.a')
        ),
      })
    ).toBe(true);
  });

  it('considère complet un topic marqué optional, même sans saisie', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig({ optional: true }),
        indicateurs: [],
      })
    ).toBe(true);
  });
});

describe('isDemarchePcaetDiagnosticComplet', () => {
  it('exige que tous les topics indicateurs soient complets', () => {
    expect(isDemarchePcaetDiagnosticComplet(diagnostic())).toBe(true);

    expect(
      isDemarchePcaetDiagnosticComplet(
        diagnostic({
          indicateurParentConfigs: [
            parentConfig(),
            parentConfig({ code: 'consommation_energetique' }),
          ],
          indicateurValeurs: [valeur(2030), valeur(2036)],
        })
      )
    ).toBe(false);
  });

  it('n’est pas complet tant que rien n’est chargé', () => {
    expect(
      isDemarchePcaetDiagnosticComplet(
        diagnostic({
          indicateurParentConfigs: [],
          indicateurValeurs: [],
        })
      )
    ).toBe(false);
  });

  it('ignore la vulnérabilité dans le calcul de complétude', () => {
    expect(
      isDemarchePcaetDiagnosticComplet(
        diagnostic({
          vulnerabilite: {
            ...vulnerabiliteTopic(),
            thematiques: [
              {
                id: 1,
                code: 'eau',
                label: 'Eau',
                requis: true,
                isSocle: true,
              },
            ],
          },
        })
      )
    ).toBe(true);
  });

  it('ne bloque pas sur un topic optional sans saisie', () => {
    expect(
      isDemarchePcaetDiagnosticComplet(
        diagnostic({
          indicateurParentConfigs: [
            parentConfig(),
            parentConfig({ code: 'sequestration', optional: true }),
          ],
        })
      )
    ).toBe(true);
  });
});
