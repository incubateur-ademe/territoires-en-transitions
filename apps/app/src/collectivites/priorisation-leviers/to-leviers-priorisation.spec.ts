import { describe, expect, it } from 'vitest';
import { Mobilisation } from './to-levier-cards';
import {
  toLeviersPriorisation,
  toPotentielsReduction,
  TrajectoireLeviers,
} from './to-leviers-priorisation';

const toMobilisation = (leviers: Mobilisation['leviers']): Mobilisation => ({
  collectiviteId: 1,
  leviers,
});

const toTrajectoire = (
  leviers: { nom: string; objectifReduction: number | null }[]
): TrajectoireLeviers => ({
  sourcesResultats: [],
  identifiantManquants: [],
  secteurs: [
    {
      nom: 'Transports',
      identifiants: [],
      resultat2019: null,
      objectif2019: null,
      objectif2030: null,
      sousSecteurs: [],
      leviers: leviers.map((levier) => ({
        ...levier,
        pourcentageRegional: 10,
      })),
    },
  ],
});

describe('toPotentielsReduction', () => {
  it('convertit un objectif de réduction négatif en potentiel positif, indexé par identifiant de levier', () => {
    const potentiels = toPotentielsReduction(
      toTrajectoire([{ nom: 'Covoiturage', objectifReduction: -12.5 }])
    );

    expect(potentiels).toEqual({
      status: 'disponible',
      byLevier: new Map([['covoiturage', 12.5]]),
    });
  });

  it('ramène à 0 un objectif qui prévoit une hausse', () => {
    const potentiels = toPotentielsReduction(
      toTrajectoire([{ nom: 'Covoiturage', objectifReduction: 3 }])
    );

    expect(potentiels).toEqual({
      status: 'disponible',
      byLevier: new Map([['covoiturage', 0]]),
    });
  });

  it('ignore les leviers sans objectif et ceux dont le nom est inconnu du domaine', () => {
    const potentiels = toPotentielsReduction(
      toTrajectoire([
        { nom: 'Covoiturage', objectifReduction: null },
        { nom: 'Levier inconnu', objectifReduction: -5 },
      ])
    );

    expect(potentiels).toEqual({
      status: 'disponible',
      byLevier: new Map(),
    });
  });
});

describe('toLeviersPriorisation', () => {
  it('note la mobilisation en pourcentage de la note maximale, moyennée sur les 6 catégories', () => {
    const leviers = toLeviersPriorisation({
      pertinences: [],
      mobilisation: toMobilisation([
        {
          levierId: 'covoiturage',
          ficheCount: 2,
          volets: [
            { categorie: 'amenagement', note: 3, ficheCount: 1 },
            { categorie: 'financement', note: 3, ficheCount: 1 },
            { categorie: 'planification', note: 3, ficheCount: 0 },
          ],
        },
      ]),
      potentiels: { status: 'indisponible' },
    });

    expect(
      leviers.find(({ levierId }) => levierId === 'covoiturage')
        ?.mobilisationScore
    ).toBe(50);
  });

  it('donne la note de chaque catégorie, à 0 pour une catégorie sans volet', () => {
    const leviers = toLeviersPriorisation({
      pertinences: [],
      mobilisation: toMobilisation([
        {
          levierId: 'covoiturage',
          ficheCount: 1,
          volets: [{ categorie: 'gouvernance', note: 2, ficheCount: 1 }],
        },
      ]),
      potentiels: { status: 'indisponible' },
    });

    expect(
      leviers.find(({ levierId }) => levierId === 'covoiturage')
        ?.noteByCategorie
    ).toEqual({
      amenagement: 0,
      planification: 0,
      financement: 0,
      gouvernance: 2,
      exemplarite: 0,
      sensibilisation: 0,
    });
  });

  it("met à 0 la mobilisation des leviers absents de l'analyse", () => {
    const leviers = toLeviersPriorisation({
      pertinences: [],
      mobilisation: toMobilisation([]),
      potentiels: { status: 'indisponible' },
    });

    expect(
      leviers.every(({ mobilisationScore }) => mobilisationScore === 0)
    ).toBe(true);
  });

  it('attache le potentiel de réduction aux seuls leviers connus de la trajectoire', () => {
    const leviers = toLeviersPriorisation({
      pertinences: [],
      mobilisation: toMobilisation([]),
      potentiels: {
        status: 'disponible',
        byLevier: new Map([['covoiturage', 12.5]]),
      },
    });

    expect(
      leviers.find(({ levierId }) => levierId === 'covoiturage')
        ?.potentielReduction
    ).toBe(12.5);
    expect(
      leviers.find(({ levierId }) => levierId === 'velo_transport_commun')
    ).not.toHaveProperty('potentielReduction');
  });
});
