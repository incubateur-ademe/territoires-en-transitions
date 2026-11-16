import {
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { fakeRow } from '../../../../indicateurs/valeurs/grid/__tests__/grid-fixtures';
import {
  buildDiagnosticIndicateurTableRows,
  buildDiagnosticIndicateurValeurInput,
} from './diagnostic-indicateur-table.adapter';

describe('obligations des valeurs du diagnostic PCAET', () => {
  const periode = (year: number) =>
    IndicateurPeriodes.parse(IndicateurPeriodiciteEnum.ANNUELLE, String(year));
  const buildRow = ({
    isOptional = false,
    isApplicable = true,
    periodicite = IndicateurPeriodiciteEnum.ANNUELLE,
    isReferenceResultatRequired = true,
  }: {
    isOptional?: boolean;
    isApplicable?: boolean;
    periodicite?: IndicateurPeriodicite;
    isReferenceResultatRequired?: boolean;
  } = {}) => {
    const fixture = fakeRow({
      indicateurId: 12,
      indicateurLabel: 'Résidentiel',
    });
    return buildDiagnosticIndicateurTableRows({
      id: 'emissions_ges',
      title: 'Émissions GES',
      section: null,
      isOptional: false,
      rows: [
        {
          label: 'Résidentiel',
          indicateurDefinitionId: 'cae_63.b',
          isOptional,
          isReferenceResultatRequired,
        },
      ],
      indicateurDefinitions: [
        {
          ...fixture.indicateurDefinition,
          collectiviteId: null,
          identifiantReferentiel: 'cae_63.b',
          isApplicable,
          periodicite,
        },
      ],
      indicateurValeurs: [],
    })[0];
  };

  it.each([
    IndicateurPeriodiciteEnum.MENSUELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
  ])('refuse une définition %s dans le diagnostic annuel', (periodicite) => {
    expect(() => buildRow({ periodicite })).toThrow(
      'INDICATEUR_ANNUAL_PERIODICITE_REQUIRED'
    );
  });

  it.each([2030, 2036, 2050])('exige la valeur de %i', (year) => {
    expect(buildRow().isValeurRequired(periode(year))).toBe(true);
  });

  it("réclame la référence tant qu'elle n'est pas choisie", () => {
    expect(buildRow().isValeurRequired(null)).toBe(true);
  });

  it('réclame le constat sur une année de référence, pas sur un horizon libre', () => {
    expect(buildRow().isValeurRequired(periode(2021))).toBe(true);
    expect(buildRow().isValeurRequired(periode(2040))).toBe(false);
  });

  it('ne réclame que les horizons d’objectif sur une ligne à référence facultative', () => {
    const row = buildRow({ isReferenceResultatRequired: false });
    expect(row.isValeurRequired(null)).toBe(false);
    expect(row.isValeurRequired(periode(2021))).toBe(false);
    expect(row.isValeurRequired(periode(2030))).toBe(true);
  });

  it.each([periode(2030), null])(
    'ne réclame aucune valeur pour une ligne facultative',
    (periode) => {
      expect(buildRow({ isOptional: true }).isValeurRequired(periode)).toBe(
        false
      );
    }
  );

  it.each([periode(2030), null])(
    'ne réclame aucune valeur pour un indicateur non applicable',
    (periode) => {
      expect(buildRow({ isApplicable: false }).isValeurRequired(periode)).toBe(
        false
      );
    }
  );
});

describe('adaptation des écritures PCAET', () => {
  it.each([0, null])(
    'conserve la valeur %s en convertissant la période en année',
    (value) => {
      expect(
        buildDiagnosticIndicateurValeurInput({
          indicateurId: 12,
          periode: IndicateurPeriodes.parse(
            IndicateurPeriodiciteEnum.ANNUELLE,
            '2026'
          ),
          field: 'resultat',
          value,
        })
      ).toEqual({ indicateurId: 12, year: 2026, field: 'resultat', value });
    }
  );
});
