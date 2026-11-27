import { describe, expect, it } from 'vitest';
import { IndicateurPeriodiciteEnum } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import {
  buildDepot,
  sortIndicateursObjectifs,
  computeAvancementObjectif,
  computeEvolutionObjectif,
  pickDepart,
  pickDernier,
  getHorizonParDefaut,
  LigneValeurIndicateurObjectif,
  listObjectifs,
  pickObjectifAHorizon,
  pickResultats,
} from './indicateurs-objectifs.rules';

const ligne = (
  partial: Partial<LigneValeurIndicateurObjectif>
): LigneValeurIndicateurObjectif => ({
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  dateValeur: '2020-01-01',
  resultat: null,
  objectif: null,
  metadonneeId: null,
  sourceId: null,
  sourceLibelle: null,
  ordreAffichage: null,
  dateVersion: null,
  ...partial,
});

const openData = (
  sourceId: string,
  ordreAffichage: number | null,
  partial: Partial<LigneValeurIndicateurObjectif>
) =>
  ligne({
    sourceId,
    sourceLibelle: `Libellé ${sourceId}`,
    ordreAffichage,
    metadonneeId: 1,
    dateVersion: '2024-01-01T00:00:00',
    ...partial,
  });

const ANNUELLE = IndicateurPeriodiciteEnum.ANNUELLE;

describe('pickResultats', () => {
  it('retient tous les résultats de la collectivité, dans l’ordre, même si l’open data existe', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({ dateValeur: '2021-01-01', resultat: 10 }),
          ligne({ dateValeur: '2030-01-01', objectif: 5 }),
          openData('rare', 1, { dateValeur: '2024-01-01', resultat: 99 }),
        ],
        ANNUELLE
      )
    ).toEqual({
      source: { type: 'collectivite' },
      points: [
        { dateValeur: '2021-01-01', valeur: 10 },
        { dateValeur: '2023-01-01', valeur: 12 },
      ],
    });
  });

  it('se replie sur la seule source open data au plus petit ordre d’affichage', () => {
    expect(
      pickResultats(
        [
          openData('citepa', 2, { dateValeur: '2023-01-01', resultat: 7 }),
          openData('rare', 1, { dateValeur: '2021-01-01', resultat: 3 }),
          openData('rare', 1, { dateValeur: '2022-01-01', resultat: 4 }),
          openData('sans-ordre', null, {
            dateValeur: '2024-01-01',
            resultat: 1,
          }),
        ],
        ANNUELLE
      )
    ).toEqual({
      source: { type: 'open-data', libelle: 'Libellé rare' },
      points: [
        { dateValeur: '2021-01-01', valeur: 3 },
        { dateValeur: '2022-01-01', valeur: 4 },
      ],
    });
  });

  it('garde la version la plus récente d’une même date open data', () => {
    expect(
      pickResultats(
        [
          openData('rare', 1, {
            metadonneeId: 1,
            dateVersion: '2023-01-01T00:00:00',
            dateValeur: '2022-01-01',
            resultat: 5,
          }),
          openData('rare', 1, {
            metadonneeId: 2,
            dateVersion: '2024-06-01T00:00:00',
            dateValeur: '2022-01-01',
            resultat: 6,
          }),
        ],
        ANNUELLE
      )?.points
    ).toEqual([{ dateValeur: '2022-01-01', valeur: 6 }]);
  });

  it('ignore les valeurs d’une autre périodicité que celle de l’indicateur', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({
            periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
            dateValeur: '2024-03-01',
            resultat: 1,
          }),
        ],
        ANNUELLE
      )?.points
    ).toEqual([{ dateValeur: '2023-01-01', valeur: 12 }]);
  });

  it('masque le dernier résultat de la collectivité à la périodicité de l’indicateur, sans égard aux autres', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2022-01-01', resultat: 10 }),
          ligne({ dateValeur: '2023-01-01', resultat: 12 }),
          ligne({
            periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
            dateValeur: '2024-03-01',
            resultat: 1,
          }),
        ],
        ANNUELLE,
        { maskDernierResultatCollectivite: true }
      )?.points
    ).toEqual([{ dateValeur: '2022-01-01', valeur: 10 }]);
  });

  it('ne bascule pas sur l’open data quand le seul résultat de la collectivité est masqué', () => {
    expect(
      pickResultats(
        [
          ligne({ dateValeur: '2023-01-01', resultat: 21 }),
          openData('rare', 1, { dateValeur: '2022-01-01', resultat: 7 }),
        ],
        ANNUELLE,
        { maskDernierResultatCollectivite: true }
      )
    ).toBeNull();
  });

  it('renvoie null sans aucun résultat', () => {
    expect(pickResultats([ligne({ objectif: 3 })], ANNUELLE)).toBeNull();
  });
});

describe('listObjectifs', () => {
  it('liste les objectifs de la collectivité par année, sans trajectoire open data', () => {
    expect(
      listObjectifs([
        ligne({ dateValeur: '2050-01-01', objectif: 0 }),
        ligne({ dateValeur: '2030-12-01', objectif: 45 }),
        ligne({ dateValeur: '2030-01-01', objectif: 50 }),
        openData('snbc', 1, { dateValeur: '2036-01-01', objectif: 40 }),
      ])
    ).toEqual([
      { annee: 2030, valeur: 45 },
      { annee: 2050, valeur: 0 },
    ]);
  });
});

describe('pickObjectifAHorizon', () => {
  const objectifs = [
    { annee: 2026, valeur: 80 },
    { annee: 2030, valeur: 50 },
    { annee: 2050, valeur: 0 },
  ];

  it('retient le dernier objectif fixé jusqu’à l’horizon', () => {
    expect(pickObjectifAHorizon(objectifs, 2030)).toEqual({
      annee: 2030,
      valeur: 50,
    });
    expect(pickObjectifAHorizon(objectifs, 2036)).toEqual({
      annee: 2030,
      valeur: 50,
    });
    expect(pickObjectifAHorizon(objectifs, 2050)).toEqual({
      annee: 2050,
      valeur: 0,
    });
  });

  it('renvoie null sans objectif avant l’horizon', () => {
    expect(pickObjectifAHorizon([{ annee: 2050, valeur: 0 }], 2030)).toBeNull();
  });
});

describe('getHorizonParDefaut', () => {
  it('propose le prochain horizon, sinon le dernier', () => {
    expect(getHorizonParDefaut(2026)).toBe(2030);
    expect(getHorizonParDefaut(2030)).toBe(2030);
    expect(getHorizonParDefaut(2031)).toBe(2036);
    expect(getHorizonParDefaut(2060)).toBe(2050);
  });
});

describe('sortIndicateursObjectifs', () => {
  const indicateur = (
    id: number,
    titre: string,
    {
      sources = ['plan'],
      identifiantReferentiel = null,
    }: {
      sources?: ('plan' | 'reglementaire')[];
      identifiantReferentiel?: string | null;
    } = {}
  ) => ({ id, titre, sources, identifiantReferentiel });

  it('suit l’ordre choisi par la collectivité, puis trie le reste par titre', () => {
    expect(
      sortIndicateursObjectifs(
        [
          indicateur(1, 'Air'),
          indicateur(2, 'Zéro artificialisation'),
          indicateur(3, 'Bâtiments'),
        ],
        [2, 1]
      ).map(({ titre }) => titre)
    ).toEqual(['Zéro artificialisation', 'Air', 'Bâtiments']);
  });

  it('sans ordre choisi, range les réglementaires dans l’ordre du dépôt avant le reste', () => {
    expect(
      sortIndicateursObjectifs(
        [
          indicateur(1, 'Bornes'),
          indicateur(2, 'Production ENR', {
            sources: ['reglementaire'],
            identifiantReferentiel: 'cae_3.a',
          }),
          indicateur(3, 'Émissions GES', {
            sources: ['reglementaire', 'plan'],
            identifiantReferentiel: 'cae_1.a',
          }),
          indicateur(4, 'Ratio ENR', {
            sources: ['reglementaire'],
            identifiantReferentiel: 'cae_3.b',
          }),
        ],
        [],
        ['cae_1.a', 'cae_3.a', 'cae_3.b']
      ).map(({ titre }) => titre)
    ).toEqual(['Émissions GES', 'Production ENR', 'Ratio ENR', 'Bornes']);
  });

  it('ne retient pas les favoris en tête', () => {
    expect(
      sortIndicateursObjectifs([
        { ...indicateur(1, 'Bornes'), favori: true },
        { ...indicateur(2, 'Air'), favori: false },
      ]).map(({ titre }) => titre)
    ).toEqual(['Air', 'Bornes']);
  });
});

describe('pickDepart / pickDernier', () => {
  const points = [
    { dateValeur: '2015-01-01', valeur: 152 },
    { dateValeur: '2019-07-01', valeur: 140 },
    { dateValeur: '2024-01-01', valeur: 124 },
  ];

  it('part du premier résultat et finit au dernier, à l’année', () => {
    expect(pickDepart(points)).toEqual({
      annee: 2015,
      valeur: 152,
      dateValeur: '2015-01-01',
    });
    expect(pickDernier(points)).toEqual({
      annee: 2024,
      valeur: 124,
      dateValeur: '2024-01-01',
    });
  });

  it('préfère le départ du dépôt PCAET', () => {
    expect(pickDepart(points, { annee: 2018, valeur: 150 })).toEqual({
      annee: 2018,
      valeur: 150,
    });
  });

  it('renvoie null sans résultat', () => {
    expect(pickDepart([])).toBeNull();
    expect(pickDernier([])).toBeNull();
  });
});

describe('computeAvancementObjectif', () => {
  // l'exemple d'Ugo : 152 en 2015, 124 en 2024, objectif 90 en 2030
  const ges = {
    depart: { annee: 2015, valeur: 152 },
    dernier: { annee: 2024, valeur: 124 },
    cible: { annee: 2030, valeur: 90 },
    anneeCourante: 2026,
  };

  it('compare le chemin parcouru au temps écoulé : en retard', () => {
    const avancement = computeAvancementObjectif(ges);
    expect(avancement?.chemin).toBeCloseTo(28 / 62);
    expect(avancement?.tempsEcoule).toBeCloseTo(0.6);
    expect(avancement?.evolutionDepuisDepart).toBeCloseTo(-28 / 152);
    expect(avancement?.evolutionObjectif).toBeCloseTo(-62 / 152);
    expect(avancement?.etat).toBe('en-retard');
  });

  it('vaut aussi à la hausse : à l’heure', () => {
    const avancement = computeAvancementObjectif({
      depart: { annee: 2015, valeur: 100 },
      dernier: { annee: 2020, valeur: 180 },
      cible: { annee: 2030, valeur: 250 },
      anneeCourante: 2026,
    });
    expect(avancement?.chemin).toBeCloseTo(80 / 150);
    expect(avancement?.tempsEcoule).toBeCloseTo(1 / 3);
    expect(avancement?.etat).toBe('a-l-heure');
  });

  it('signale le recul, avec un chemin négatif', () => {
    const avancement = computeAvancementObjectif({
      ...ges,
      dernier: { annee: 2024, valeur: 160 },
    });
    expect(avancement?.chemin).toBeLessThan(0);
    expect(avancement?.evolutionDepuisDepart).toBeCloseTo(8 / 152);
    expect(avancement?.etat).toBe('en-recul');
  });

  it('dit l’objectif atteint au-delà de 100 %', () => {
    expect(
      computeAvancementObjectif({
        ...ges,
        dernier: { annee: 2024, valeur: 85 },
      })?.etat
    ).toBe('atteint');
  });

  it('après l’échéance, ne dit plus que atteint ou manqué', () => {
    const apres = { ...ges, anneeCourante: 2031 };
    expect(computeAvancementObjectif(apres)?.etat).toBe('echeance-manquee');
    expect(
      computeAvancementObjectif({
        ...apres,
        dernier: { annee: 2030, valeur: 88 },
      })?.etat
    ).toBe('echeance-atteinte');
  });

  it('borne le temps écoulé à 1 quand le dernier résultat dépasse l’échéance', () => {
    expect(
      computeAvancementObjectif({
        ...ges,
        dernier: { annee: 2032, valeur: 100 },
        anneeCourante: 2033,
      })?.tempsEcoule
    ).toBe(1);
  });

  it('n’a pas d’évolution en pourcentage depuis un départ nul', () => {
    const avancement = computeAvancementObjectif({
      depart: { annee: 2015, valeur: 0 },
      dernier: { annee: 2020, valeur: 10 },
      cible: { annee: 2030, valeur: 40 },
      anneeCourante: 2026,
    });
    expect(avancement?.chemin).toBeCloseTo(0.25);
    expect(avancement?.evolutionDepuisDepart).toBeNull();
    expect(avancement?.evolutionObjectif).toBeNull();
  });

  it('pas de barre sans départ, dernier résultat ou cible', () => {
    expect(computeAvancementObjectif({ ...ges, depart: null })).toBeNull();
    expect(computeAvancementObjectif({ ...ges, dernier: null })).toBeNull();
    expect(computeAvancementObjectif({ ...ges, cible: null })).toBeNull();
  });

  it('pas de barre si le départ est déjà l’objectif ou à son année', () => {
    expect(
      computeAvancementObjectif({ ...ges, cible: { annee: 2030, valeur: 152 } })
    ).toBeNull();
    expect(
      computeAvancementObjectif({ ...ges, cible: { annee: 2015, valeur: 90 } })
    ).toBeNull();
  });

  it('pas de barre sans résultat postérieur au départ', () => {
    expect(
      computeAvancementObjectif({
        ...ges,
        depart: { annee: 2018, valeur: 150 },
        dernier: { annee: 2016, valeur: 145 },
      })
    ).toBeNull();
    expect(
      computeAvancementObjectif({
        ...ges,
        dernier: { annee: 2015, valeur: 152 },
      })
    ).toBeNull();
  });
});

describe('computeAvancementObjectif, résultats de la même année', () => {
  it('départage deux résultats de la même année à la date complète', () => {
    const avancement = computeAvancementObjectif({
      depart: { annee: 2024, valeur: 100, dateValeur: '2024-01-01' },
      dernier: { annee: 2024, valeur: 90, dateValeur: '2024-07-01' },
      cible: { annee: 2030, valeur: 80 },
      anneeCourante: 2026,
    });
    expect(avancement?.chemin).toBeCloseTo(0.5);
  });

  it('ne compte pas un résultat antérieur de la même année', () => {
    expect(
      computeAvancementObjectif({
        depart: { annee: 2024, valeur: 100, dateValeur: '2024-07-01' },
        dernier: { annee: 2024, valeur: 90, dateValeur: '2024-01-01' },
        cible: { annee: 2030, valeur: 80 },
        anneeCourante: 2026,
      })
    ).toBeNull();
  });
});

describe('buildDepot', () => {
  it('part du résultat de l’année de référence et reprend les objectifs du dépôt', () => {
    expect(
      buildDepot(
        [
          { dateValeur: '2015-01-01', resultat: 160, objectif: null },
          { dateValeur: '2018-01-01', resultat: 152, objectif: null },
          { dateValeur: '2030-01-01', resultat: null, objectif: 90 },
          { dateValeur: '2050-01-01', resultat: null, objectif: 20 },
        ],
        2026
      )
    ).toEqual({
      departDepot: { annee: 2018, valeur: 152 },
      objectifs: [
        { annee: 2030, valeur: 90 },
        { annee: 2050, valeur: 20 },
      ],
    });
  });

  it('n’a pas de départ sans résultat révolu hors horizon', () => {
    expect(
      buildDepot(
        [{ dateValeur: '2030-01-01', resultat: 95, objectif: 90 }],
        2026
      ).departDepot
    ).toBeNull();
  });
});

describe('computeEvolutionObjectif', () => {
  it('se lit même sans résultat postérieur au départ', () => {
    expect(
      computeEvolutionObjectif(
        { annee: 2018, valeur: 250 },
        { annee: 2030, valeur: 200 }
      )
    ).toBeCloseTo(-0.2);
  });

  it('renvoie null sans départ, depuis zéro ou pour un objectif non postérieur', () => {
    expect(
      computeEvolutionObjectif(null, { annee: 2030, valeur: 1 })
    ).toBeNull();
    expect(
      computeEvolutionObjectif(
        { annee: 2018, valeur: 0 },
        { annee: 2030, valeur: 1 }
      )
    ).toBeNull();
    expect(
      computeEvolutionObjectif(
        { annee: 2030, valeur: 5 },
        { annee: 2030, valeur: 1 }
      )
    ).toBeNull();
  });
});
