import { sum } from 'es-toolkit';
import { describe, expect, it } from 'vitest';
import { LevierPriorisation, NO_MOBILISATION } from './to-leviers-priorisation';
import {
  findLevierToPrioritizeId,
  isBlindSpot,
  LevierPlace,
  LevierTooltip,
  LevierTooltipInput,
  toLevierToPrioritizeId,
  toLeviersPlaces,
  toLeviersToPrioritizeIds,
  toLeviersWithoutPotentiel,
  toMatrixPoints,
  toQuadrant,
} from './to-matrix-points';

const toTooltip = ({
  levier,
  preselectedCount,
}: LevierTooltipInput): LevierTooltip => ({
  description: [levier.levierId, `${preselectedCount} présélectionnée`],
  badge: { label: 'Non mobilisé', variant: 'grey' },
  hint: 'indice',
});

const toLevier = (
  overrides: Partial<LevierPriorisation> & Pick<LevierPriorisation, 'levierId'>
): LevierPriorisation => ({
  nom: 'Covoiturage',
  secteur: 'Transports',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: NO_MOBILISATION,
  ...overrides,
});

const toPlace = (
  overrides: Partial<LevierPlace> & Pick<LevierPlace, 'levierId'>
): LevierPlace => ({
  ...toLevier(overrides),
  potentielReduction: 10,
  potentielScore: 100,
  impactIndex: 100,
  impactIndexByCategorie: new Map(),
  ...overrides,
});

describe('toLeviersPlaces', () => {
  it('écarte les leviers sans potentiel et place le plus fort à 90, sous le bord haut de la matrice', () => {
    const places = toLeviersPlaces([
      toLevier({ levierId: 'covoiturage', potentielReduction: 40 }),
      toLevier({ levierId: 'velo_transport_commun', potentielReduction: 10 }),
      toLevier({ levierId: 'biogaz' }),
    ]);

    expect(
      places.map(({ levierId, potentielScore }) => [levierId, potentielScore])
    ).toEqual([
      ['covoiturage', 90],
      ['velo_transport_commun', 23],
    ]);
  });

  it('répartit le potentiel total sur 100 entre toutes les catégories, un levier valant la somme de ses catégories', () => {
    const places = toLeviersPlaces([
      toLevier({ levierId: 'covoiturage', potentielReduction: 1 }),
      toLevier({ levierId: 'velo_transport_commun', potentielReduction: 1 }),
      toLevier({ levierId: 'biogaz', potentielReduction: 1 }),
    ]);

    expect({
      categoriesTotal: sum(
        places.flatMap(({ impactIndexByCategorie }) => [
          ...impactIndexByCategorie.values(),
        ])
      ),
      leviersTotal: sum(places.map(({ impactIndex }) => impactIndex)),
      leviersMatchTheirCategories: places.every(
        ({ impactIndex, impactIndexByCategorie }) =>
          impactIndex === sum([...impactIndexByCategorie.values()])
      ),
    }).toEqual({
      categoriesTotal: 100,
      leviersTotal: 100,
      leviersMatchTheirCategories: true,
    });
  });

  it("place tout à 0 quand aucun levier n'a de potentiel positif", () => {
    const places = toLeviersPlaces([
      toLevier({ levierId: 'covoiturage', potentielReduction: 0 }),
    ]);

    expect(places[0].potentielScore).toBe(0);
  });
});

describe('toLeviersWithoutPotentiel', () => {
  it("ne garde que les leviers sans potentiel connu, même quand la matrice en place d'autres", () => {
    const leviers = toLeviersWithoutPotentiel([
      toLevier({ levierId: 'covoiturage', potentielReduction: 40 }),
      toLevier({ levierId: 'biogaz' }),
      toLevier({ levierId: 'velo_transport_commun', potentielReduction: 0 }),
    ]);

    expect(leviers.map(({ levierId }) => levierId)).toEqual(['biogaz']);
  });
});

describe('toQuadrant', () => {
  it.each([
    [50, 0, 'high_impact_low_mobilisation'],
    [50, 50, 'high_impact_high_mobilisation'],
    [49, 0, 'low_impact_low_mobilisation'],
    [49, 50, 'low_impact_high_mobilisation'],
  ] as const)(
    'potentiel %i et mobilisation %i → %s',
    (potentielScore, mobilisationScore, quadrant) => {
      expect(toQuadrant({ potentielScore, mobilisationScore })).toBe(quadrant);
    }
  );
});

describe('toLeviersToPrioritizeIds', () => {
  it('retient les deux angles morts au plus fort potentiel, du plus fort au moins fort', () => {
    const places = [
      toPlace({ levierId: 'covoiturage', potentielScore: 70 }),
      toPlace({ levierId: 'biogaz', potentielScore: 90 }),
      toPlace({ levierId: 'bus_cars_decarbones', potentielScore: 60 }),
    ];

    expect(toLeviersToPrioritizeIds(places)).toEqual(['biogaz', 'covoiturage']);
  });

  it('ignore les leviers bien mobilisés, même à fort potentiel', () => {
    const places = [
      toPlace({
        levierId: 'covoiturage',
        potentielScore: 95,
        mobilisationScore: 60,
      }),
      toPlace({ levierId: 'biogaz', potentielScore: 60 }),
    ];

    expect(toLeviersToPrioritizeIds(places)).toEqual(['biogaz']);
  });
});

describe('toLevierToPrioritizeId', () => {
  it("retient l'angle mort au plus fort potentiel", () => {
    const places = [
      toPlace({ levierId: 'covoiturage', potentielScore: 70 }),
      toPlace({ levierId: 'biogaz', potentielScore: 90 }),
      toPlace({ levierId: 'bus_cars_decarbones', potentielScore: 60 }),
    ];

    expect(toLevierToPrioritizeId(places)).toBe('biogaz');
  });

  it('ignore les leviers qui ne sont pas des angles morts, même à fort potentiel', () => {
    const places = [
      toPlace({
        levierId: 'covoiturage',
        potentielScore: 95,
        mobilisationScore: 60,
      }),
      toPlace({ levierId: 'biogaz', potentielScore: 60 }),
    ];

    expect(toLevierToPrioritizeId(places)).toBe('biogaz');
  });

  it("renvoie undefined quand aucun levier n'est un angle mort", () => {
    expect(
      toLevierToPrioritizeId([
        toPlace({
          levierId: 'covoiturage',
          potentielScore: 95,
          mobilisationScore: 60,
        }),
      ])
    ).toBeUndefined();
  });
});

describe('findLevierToPrioritizeId', () => {
  it("retient l'angle mort quand il en existe un", () => {
    const places = [
      toPlace({ levierId: 'covoiturage', potentielScore: 60 }),
      toPlace({ levierId: 'biogaz', potentielScore: 80 }),
    ];

    expect(findLevierToPrioritizeId(places)).toBe('biogaz');
  });

  it("à défaut d'angle mort, retient le levier pertinent le plus proche du coin haut gauche", () => {
    const places = [
      toPlace({
        levierId: 'covoiturage',
        potentielScore: 80,
        mobilisationScore: 60,
      }),
      toPlace({
        levierId: 'biogaz',
        potentielScore: 40,
        mobilisationScore: 10,
      }),
    ];

    expect(findLevierToPrioritizeId(places)).toBe('biogaz');
  });

  it('écarte les leviers non pertinents du repli sur le coin haut gauche', () => {
    const places = [
      toPlace({
        levierId: 'covoiturage',
        potentielScore: 80,
        mobilisationScore: 60,
      }),
      toPlace({
        levierId: 'biogaz',
        potentielScore: 40,
        mobilisationScore: 10,
        pertinence: 'non_pertinent',
      }),
    ];

    expect(findLevierToPrioritizeId(places)).toBe('covoiturage');
  });

  it("renvoie undefined quand aucun levier n'est placé", () => {
    expect(findLevierToPrioritizeId([])).toBeUndefined();
  });
});

describe('isBlindSpot', () => {
  it("retient un levier à fort impact peu mobilisé dont la pertinence n'est pas écartée", () => {
    expect(
      isBlindSpot(toPlace({ levierId: 'covoiturage', potentielScore: 80 }))
    ).toBe(true);
    expect(
      isBlindSpot(
        toPlace({
          levierId: 'covoiturage',
          potentielScore: 80,
          pertinence: 'pertinent',
        })
      )
    ).toBe(true);
  });

  it('écarte un levier non pertinent ou déjà bien mobilisé', () => {
    expect(
      isBlindSpot(
        toPlace({
          levierId: 'covoiturage',
          potentielScore: 80,
          pertinence: 'non_pertinent',
        })
      )
    ).toBe(false);
    expect(
      isBlindSpot(
        toPlace({
          levierId: 'covoiturage',
          potentielScore: 80,
          mobilisationScore: 60,
        })
      )
    ).toBe(false);
  });
});

describe('toMatrixPoints', () => {
  it("grise un levier, l'éclaircit s'il est non pertinent, et le colore dès qu'une action est présélectionnée", () => {
    const points = toMatrixPoints({
      places: [
        toPlace({ levierId: 'covoiturage', pertinence: 'non_pertinent' }),
        toPlace({
          levierId: 'velo_transport_commun',
          pertinence: 'pertinent',
        }),
        toPlace({ levierId: 'biogaz' }),
        toPlace({
          levierId: 'efficacite_sobriete_logistique',
          pertinence: 'non_pertinent',
        }),
      ],
      preselectedCountByLevier: new Map([
        ['efficacite_sobriete_logistique', 2],
      ]),
      toTooltip,
    });

    expect(points.map(({ id, tone }) => [id, tone])).toEqual([
      ['covoiturage', 'light'],
      ['velo_transport_commun', 'grey'],
      ['biogaz', 'grey'],
      ['efficacite_sobriete_logistique', 'default'],
    ]);
  });

  it('projette la mobilisation en x et le potentiel en y, avec le tooltip bâti sur le nombre présélectionné', () => {
    const [point] = toMatrixPoints({
      places: [
        toPlace({
          levierId: 'covoiturage',
          mobilisationScore: 33,
          potentielScore: 75,
        }),
      ],
      preselectedCountByLevier: new Map([['covoiturage', 1]]),
      toTooltip,
    });

    expect(point).toEqual({
      id: 'covoiturage',
      label: 'Covoiturage',
      description: ['covoiturage', '1 présélectionnée'],
      badge: { label: 'Non mobilisé', variant: 'grey' },
      hint: 'indice',
      x: 33,
      y: 75,
      tone: 'default',
      isLabelled: true,
    });
  });

  it('ne labellise que les leviers en angle mort', () => {
    const points = toMatrixPoints({
      places: [
        toPlace({ levierId: 'covoiturage', potentielScore: 80 }),
        toPlace({ levierId: 'biogaz', potentielScore: 20 }),
        toPlace({
          levierId: 'velo_transport_commun',
          potentielScore: 80,
          pertinence: 'non_pertinent',
        }),
      ],
      preselectedCountByLevier: new Map(),
      toTooltip,
    });

    expect(points.map(({ id, isLabelled }) => [id, isLabelled])).toEqual([
      ['covoiturage', true],
      ['biogaz', false],
      ['velo_transport_commun', false],
    ]);
  });
});
