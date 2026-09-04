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

const valeur = ({
  year,
  identifiantReferentiel = 'cae_1.c',
  resultat = null,
  objectif = null,
}: {
  year: number;
  identifiantReferentiel?: string;
  resultat?: number | null;
  objectif?: number | null;
}): PcaetDiagnostic['indicateurValeurs'][number] =>
  ({
    indicateurValeur: {
      indicateurId: 1,
      dateValeur: `${year}-01-01`,
      resultat,
      objectif,
    },
    indicateurDefinition: { identifiantReferentiel },
  }) as PcaetDiagnostic['indicateurValeurs'][number];

/** Constat + objectifs requis (2050 exclu via optionalYears). */
const valeursCompletes = (
  identifiantReferentiel = 'cae_1.c'
): PcaetDiagnostic['indicateurValeurs'] => [
  valeur({ year: 2021, identifiantReferentiel, resultat: 12 }),
  ...PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.filter(
    (year) => year !== 2050
  ).map((year) => valeur({ year, identifiantReferentiel, objectif: 8 })),
];

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
  it('exige un constat et un objectif sur chaque horizon requis de chaque ligne', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: valeursCompletes(),
      })
    ).toBe(true);
  });

  it('échoue sans constat sur une année de référence', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.filter(
          (year) => year !== 2050
        ).map((year) => valeur({ year, objectif: 8 })),
      })
    ).toBe(false);
  });

  it('échoue dès qu’un horizon d’objectif requis manque', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: [
          valeur({ year: 2021, resultat: 12 }),
          valeur({ year: 2030, objectif: 8 }),
        ],
      })
    ).toBe(false);
  });

  it('n’exige pas un horizon listé dans optionalYears', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: [
          valeur({ year: 2021, resultat: 12 }),
          valeur({ year: 2030, objectif: 8 }),
          valeur({ year: 2036, objectif: 6 }),
        ],
      })
    ).toBe(true);
  });

  it('ignore les valeurs saisies sur les indicateurs d’un autre topic', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: valeursCompletes('cae_2.e'),
      })
    ).toBe(false);
  });

  it('n’est pas complet sur la seule saisie de l’agrégat parent', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig(),
        indicateurs: valeursCompletes('cae_1.a'),
      })
    ).toBe(false);
  });

  it('exige chaque ligne feuille, pas seulement une parmi plusieurs', () => {
    const config = parentConfig({
      children: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_1.c',
          optionalYears: [2050],
        },
        {
          label: 'Tertiaire',
          indicateurDefinitionId: 'cae_1.d',
          optionalYears: [2050],
        },
      ],
    });

    expect(
      isPcaetDiagnosticIndicateurComplet({
        config,
        indicateurs: valeursCompletes('cae_1.c'),
      })
    ).toBe(false);

    expect(
      isPcaetDiagnosticIndicateurComplet({
        config,
        indicateurs: [
          ...valeursCompletes('cae_1.c'),
          ...valeursCompletes('cae_1.d'),
        ],
      })
    ).toBe(true);
  });

  it('exige les feuilles imbriquées (ex. secteurs d’un polluant)', () => {
    const config = parentConfig({
      code: 'polluants_atmospheriques',
      referenceYearApplyLevel: 'child',
      indicateurDefinitionId: 'emission_polluants_atmo',
      children: [
        {
          label: 'NOx',
          indicateurDefinitionId: 'cae_4.a',
          children: [
            { label: 'Résidentiel', indicateurDefinitionId: 'cae_4.aa' },
            { label: 'Tertiaire', indicateurDefinitionId: 'cae_4.ab' },
          ],
        },
      ],
    });

    const completeLeaf = (identifiantReferentiel: string) => [
      valeur({ year: 2010, identifiantReferentiel, resultat: 10 }),
      ...PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.map((year) =>
        valeur({ year, identifiantReferentiel, objectif: 5 })
      ),
    ];

    expect(
      isPcaetDiagnosticIndicateurComplet({
        config,
        indicateurs: completeLeaf('cae_4.aa'),
      })
    ).toBe(false);

    expect(
      isPcaetDiagnosticIndicateurComplet({
        config,
        indicateurs: [
          ...completeLeaf('cae_4.aa'),
          ...completeLeaf('cae_4.ab'),
        ],
      })
    ).toBe(true);
  });

  it('ignore une ligne entièrement optionnelle (optionalYears all)', () => {
    expect(
      isPcaetDiagnosticIndicateurComplet({
        config: parentConfig({
          children: [
            {
              label: 'Forêt',
              indicateurDefinitionId: 'cae_63.b',
              optionalYears: 'all',
            },
          ],
        }),
        indicateurs: [],
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
            parentConfig({
              code: 'consommation_energetique',
              indicateurDefinitionId: 'cae_2.a',
              children: [
                {
                  label: 'Résidentiel',
                  indicateurDefinitionId: 'cae_2.e',
                  optionalYears: [2050],
                },
              ],
            }),
          ],
          // Seul le premier topic est saisi : le second reste incomplet.
          indicateurValeurs: valeursCompletes('cae_1.c'),
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
