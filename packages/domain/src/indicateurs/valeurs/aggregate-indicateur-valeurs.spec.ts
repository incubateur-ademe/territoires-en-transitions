import { describe, expect, it } from 'vitest';
import { aggregateIndicateurValeurs } from './aggregate-indicateur-valeurs';

const monthly = Array.from({ length: 12 }, (_, index) => ({
  periodicite: 'mensuelle' as const,
  dateValeur: `2026-${String(index + 1).padStart(2, '0')}-01`,
  resultat: 10,
  objectif: 20,
  resultatCommentaire: `Commentaire ${index + 1}`,
  metadonneeId: null,
}));

describe('aggregateIndicateurValeurs', () => {
  it.each([
    ['trimestrielle', 4, 30],
    ['semestrielle', 2, 60],
    ['annuelle', 1, 120],
  ] as const)(
    'regroupe douze mois en %s sans modifier les observations',
    (periodiciteAffichage, count, resultat) => {
      const original = structuredClone(monthly);
      const display = aggregateIndicateurValeurs(monthly, {
        periodiciteAffichage,
        aggregationResultat: 'somme',
      });
      expect(display).toHaveLength(count);
      expect(
        display.every(
          (value) => value.resultat === resultat && value.isAggregated
        )
      ).toBe(true);
      expect(display.flatMap((value) => value.valeursSources)).toEqual(monthly);
      expect(monthly).toEqual(original);
      expect(
        aggregateIndicateurValeurs(monthly, {
          periodiciteAffichage: 'mensuelle',
        }).map((value) => value.resultat)
      ).toEqual(Array(12).fill(10));
    }
  );

  it('applique des règles explicites et distinctes aux résultats et objectifs', () => {
    const values = monthly.map((value, index) => ({
      ...value,
      objectif: index + 1,
    }));
    expect(
      aggregateIndicateurValeurs(values, {
        periodiciteAffichage: 'annuelle',
        aggregationResultat: 'moyenne',
        aggregationObjectif: 'derniere_valeur',
      })[0]
    ).toMatchObject({ resultat: 10, objectif: 12 });
    expect(
      aggregateIndicateurValeurs(values, {
        periodiciteAffichage: 'annuelle',
      })[0]
    ).toMatchObject({ resultat: null, objectif: null });
  });

  it('garde les périodes incomplètes ou nulles vides et conserve zéro', () => {
    const options = {
      periodiciteAffichage: 'annuelle',
      aggregationResultat: 'somme',
    } as const;
    expect(
      aggregateIndicateurValeurs(monthly.slice(1), options)[0].resultat
    ).toBeNull();
    expect(
      aggregateIndicateurValeurs(
        monthly.map((value, index) => ({
          ...value,
          resultat: index ? 10 : null,
        })),
        options
      )[0].resultat
    ).toBeNull();
    expect(
      aggregateIndicateurValeurs(
        monthly.map((value) => ({ ...value, resultat: 0 })),
        options
      )[0].resultat
    ).toBe(0);
  });

  it('préserve la série annuelle externe à une cadence plus fine', () => {
    const annuelle = {
      periodicite: 'annuelle' as const,
      dateValeur: '2026-01-01',
      resultat: 900,
      metadonneeId: 8,
    };
    const display = aggregateIndicateurValeurs([annuelle], {
      periodiciteAffichage: 'mensuelle',
      aggregationResultat: 'somme',
    });
    expect(display).toHaveLength(1);
    expect(display[0]).toMatchObject({
      periodicite: 'annuelle',
      resultat: 900,
      isAggregated: false,
      valeursSources: [annuelle],
    });
  });

  it('sépare les sources et cadences qui partagent le même début annuel', () => {
    const display = aggregateIndicateurValeurs(
      [
        ...monthly,
        ...monthly.map((value) => ({
          ...value,
          metadonneeId: 2,
          resultat: 20,
        })),
        {
          periodicite: 'annuelle' as const,
          dateValeur: '2026-01-01',
          resultat: 900,
          objectif: 0,
          resultatCommentaire: 'Source annuelle',
          metadonneeId: null,
        },
      ],
      { periodiciteAffichage: 'annuelle', aggregationResultat: 'somme' }
    );
    expect(display).toHaveLength(3);
    expect(display.map((value) => value.resultat)).toEqual(
      expect.arrayContaining([120, 240, 900])
    );
    expect(
      display.filter((value) => value.periodiciteSource === 'mensuelle')
    ).toHaveLength(2);
  });
  it('laisse un trou pour une année entièrement absente entre deux années renseignées', () => {
    const values = [
      ...monthly.map((value) => ({
        ...value,
        dateValeur: value.dateValeur.replace('2026', '2024'),
      })),
      ...monthly,
      ...monthly.map((value) => ({ ...value, metadonneeId: 2 })),
    ];
    const display = aggregateIndicateurValeurs(values, {
      periodiciteAffichage: 'annuelle',
      aggregationResultat: 'somme',
    });
    expect(
      display
        .filter((value) => value.metadonneeId === null)
        .map((value) => [value.dateValeur, value.resultat])
    ).toEqual([
      ['2024-01-01', 120],
      ['2025-01-01', null],
      ['2026-01-01', 120],
    ]);
    expect(
      display.find((value) => value.dateValeur === '2025-01-01')?.valeursSources
    ).toEqual([]);
    expect(display.filter((value) => value.metadonneeId === 2)).toHaveLength(1);
  });
});
