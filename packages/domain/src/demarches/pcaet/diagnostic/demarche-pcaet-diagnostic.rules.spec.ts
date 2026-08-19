import { describe, expect, it } from 'vitest';
import {
  buildTopicYears,
  deriveReferenceYear,
  isDiagnosticYearInBounds,
  normalizeExtraYears,
  isDemarchePcaetDiagnosticComplet,
  isDemarchePcaetTopicComplet,
  REFERENCE_YEAR_MIN,
} from './demarche-pcaet-diagnostic.rules';
import type {
  DemarchePcaetTopic,
  DemarchePcaetDiagnosticValeur,
} from './demarche-pcaet-diagnostic.schema';

const HORIZONS = [2030, 2036, 2050];

const row = (
  indicateurId: number,
  {
    requis = true,
    rows = [],
  }: {
    requis?: boolean;
    rows?: DemarchePcaetTopic['rows'][number]['rows'];
  } = {}
) => ({
  label: `ligne ${indicateurId}`,
  referentielId: `cae_${indicateurId}`,
  indicateurId,
  requis,
  rows,
});

const renseignee = (indicateurId: number): DemarchePcaetDiagnosticValeur[] => [
  { indicateurId, year: 2021, resultat: 12, objectif: null, references: [] },
  { indicateurId, year: 2030, resultat: null, objectif: 8, references: [] },
];

const topic = (
  overrides: Partial<DemarchePcaetTopic> = {}
): DemarchePcaetTopic => ({
  code: 'profil_energie_climat',
  label: 'Profil énergie climat',
  icon: 'fire-line',
  kind: 'indicateurs',
  groupLabel: 'Secteur',
  rowLabel: null,
  unit: 'kteq CO2',
  referentielId: 'cae_1.a',
  horizons: HORIZONS,
  referenceYear: 2021,
  extraYears: [],
  years: [2021, ...HORIZONS],
  rows: [row(1), row(2)],
  valeurs: [...renseignee(1), ...renseignee(2)],
  vulnerabilite: null,
  ...overrides,
});

describe('buildTopicYears', () => {
  it('compose l’année de comptabilisation et les horizons, triés', () => {
    expect(
      buildTopicYears({ referenceYear: 2021, horizons: HORIZONS })
    ).toEqual([2021, 2030, 2036, 2050]);
  });

  it('ne duplique pas une année de comptabilisation tombant sur un horizon', () => {
    expect(
      buildTopicYears({ referenceYear: 2030, horizons: HORIZONS })
    ).toEqual([2030, 2036, 2050]);
  });

  it('respecte les horizons propres au topic', () => {
    expect(
      buildTopicYears({ referenceYear: 2024, horizons: [2050, 2100] })
    ).toEqual([2024, 2050, 2100]);
  });

  it('insère les années ajoutées à leur place', () => {
    expect(
      buildTopicYears({
        referenceYear: 2021,
        horizons: HORIZONS,
        extraYears: [2019, 2033],
      })
    ).toEqual([2019, 2021, 2030, 2033, 2036, 2050]);
  });
});

describe('normalizeExtraYears', () => {
  const horizons = HORIZONS;

  it('dédoublonne et trie', () => {
    expect(
      normalizeExtraYears({
        extraYears: [2019, 2017, 2019],
        referenceYear: 2021,
        horizons,
      })
    ).toEqual([2017, 2019]);
  });

  it('écarte les années déjà affichées', () => {
    expect(
      normalizeExtraYears({
        extraYears: [2019, 2021, 2030],
        referenceYear: 2021,
        horizons,
      })
    ).toEqual([2019]);
  });

  it('libère une année ajoutée devenue année de comptabilisation', () => {
    expect(
      normalizeExtraYears({
        extraYears: [2019],
        referenceYear: 2019,
        horizons,
      })
    ).toEqual([]);
  });
});

describe('isDiagnosticYearInBounds', () => {
  it('accepte de la borne basse au dernier horizon', () => {
    expect(
      isDiagnosticYearInBounds({ year: REFERENCE_YEAR_MIN, horizons: HORIZONS })
    ).toBe(true);
    expect(isDiagnosticYearInBounds({ year: 2050, horizons: HORIZONS })).toBe(
      true
    );
  });

  it('refuse en deçà de la borne basse et au-delà du dernier horizon', () => {
    expect(
      isDiagnosticYearInBounds({
        year: REFERENCE_YEAR_MIN - 1,
        horizons: HORIZONS,
      })
    ).toBe(false);
    expect(isDiagnosticYearInBounds({ year: 2051, horizons: HORIZONS })).toBe(
      false
    );
  });

  it('suit les horizons du topic', () => {
    expect(
      isDiagnosticYearInBounds({ year: 2080, horizons: [2050, 2100] })
    ).toBe(true);
  });
});

describe('deriveReferenceYear', () => {
  it('propose l’année la plus récente ayant un résultat', () => {
    expect(
      deriveReferenceYear({
        resultYears: [2016, 2021, 2019],
        currentYear: 2026,
      })
    ).toBe(2021);
  });

  it('retombe sur l’année courante sans résultat', () => {
    expect(deriveReferenceYear({ resultYears: [], currentYear: 2026 })).toBe(
      2026
    );
  });

  it('ignore les années futures et celles sous la borne de saisie', () => {
    expect(
      deriveReferenceYear({
        resultYears: [2021, 2030, REFERENCE_YEAR_MIN - 1],
        currentYear: 2026,
      })
    ).toBe(2021);
  });
});

describe('isDemarchePcaetTopicComplet', () => {
  it('est complet quand chaque ligne requise porte un résultat et un objectif', () => {
    expect(isDemarchePcaetTopicComplet(topic())).toBe(true);
  });

  it('n’est pas complet dès qu’une ligne requise manque son résultat', () => {
    expect(
      isDemarchePcaetTopicComplet(
        topic({ valeurs: [...renseignee(1), renseignee(2)[1]] })
      )
    ).toBe(false);
  });

  it('n’est pas complet dès qu’une ligne requise manque son objectif', () => {
    expect(
      isDemarchePcaetTopicComplet(
        topic({ valeurs: [...renseignee(1), renseignee(2)[0]] })
      )
    ).toBe(false);
  });

  it('ignore les lignes non requises', () => {
    expect(
      isDemarchePcaetTopicComplet(
        topic({
          rows: [row(1), row(2, { requis: false })],
          valeurs: renseignee(1),
        })
      )
    ).toBe(true);
  });

  it('considère complet un topic qui n’exige rien', () => {
    expect(
      isDemarchePcaetTopicComplet(
        topic({ rows: [row(1, { requis: false })], valeurs: [] })
      )
    ).toBe(true);
  });

  it('exige aussi les lignes requises du second niveau', () => {
    const avecEnfant = topic({
      rows: [row(1, { rows: [row(3)] })],
      valeurs: renseignee(1),
    });

    expect(isDemarchePcaetTopicComplet(avecEnfant)).toBe(false);
    expect(
      isDemarchePcaetTopicComplet({
        ...avecEnfant,
        valeurs: [...renseignee(1), ...renseignee(3)],
      })
    ).toBe(true);
  });

  it('ignore une ligne requise dont l’indicateur ne résout pas : elle ne peut pas être saisie', () => {
    expect(
      isDemarchePcaetTopicComplet(
        topic({
          rows: [{ ...row(1), indicateurId: null, rows: [] }],
          valeurs: [],
        })
      )
    ).toBe(true);
  });

  it('délègue le topic vulnérabilité à sa propre règle', () => {
    const vulnerable = (
      vulnerabilite: DemarchePcaetTopic['vulnerabilite']
    ): DemarchePcaetTopic =>
      topic({
        kind: 'vulnerabilite',
        rows: [],
        valeurs: [],
        referenceYear: null,
        vulnerabilite,
      });

    expect(isDemarchePcaetTopicComplet(vulnerable(null))).toBe(false);
    expect(
      isDemarchePcaetTopicComplet(
        vulnerable({
          thematiques: [
            { id: 1, code: 'eau', label: 'Eau', requis: true, isSocle: true },
          ],
          lignes: [],
        })
      )
    ).toBe(false);
    expect(
      isDemarchePcaetTopicComplet(
        vulnerable({
          thematiques: [
            { id: 1, code: 'eau', label: 'Eau', requis: true, isSocle: true },
          ],
          lignes: [
            {
              thematiqueId: 1,
              niveauMaintenant: 'faible',
              niveau2050: 'non_concerne',
              niveau2100: 'non_concerne',
              objectifs2050: null,
              objectifs2100: null,
            },
          ],
        })
      )
    ).toBe(true);
  });

  it('n’accepte pas un objectif posé hors horizon', () => {
    expect(
      isDemarchePcaetTopicComplet(
        topic({
          rows: [row(1)],
          valeurs: [
            {
              indicateurId: 1,
              year: 2021,
              resultat: 12,
              objectif: null,
              references: [],
            },
            {
              indicateurId: 1,
              year: 2045,
              resultat: null,
              objectif: 8,
              references: [],
            },
          ],
        })
      )
    ).toBe(false);
  });
});

describe('isDemarchePcaetDiagnosticComplet', () => {
  it('exige que tous les topics soient complets', () => {
    expect(
      isDemarchePcaetDiagnosticComplet({
        topics: [topic(), topic({ code: 'enr', rows: [], valeurs: [] })],
      })
    ).toBe(true);

    expect(
      isDemarchePcaetDiagnosticComplet({
        topics: [topic(), topic({ code: 'sequestration', valeurs: [] })],
      })
    ).toBe(false);
  });

  it('n’est pas complet tant que rien n’est chargé', () => {
    expect(isDemarchePcaetDiagnosticComplet({ topics: [] })).toBe(false);
  });
});
