import {
  categorieActionEnumValues,
  LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { omit } from 'es-toolkit';
import { describe, expect, it } from 'vitest';
import {
  hasMobilisation,
  LevierCard,
  LevierCategorie,
  Mobilisation,
  toLevierCards,
} from './to-levier-cards';

const toMobilisation = (leviers: Mobilisation['leviers']): Mobilisation => ({
  collectiviteId: 1,
  leviers,
});

const emptyMobilisation = toMobilisation([]);

const findCard = (
  cards: LevierCard[],
  levierId: LevierId
): LevierCard | undefined => cards.find((card) => card.levierId === levierId);

const findCardWithoutCategories = (
  cards: LevierCard[],
  levierId: LevierId
): Omit<LevierCard, 'categories'> | undefined => {
  const card = findCard(cards, levierId);
  if (card === undefined) {
    return undefined;
  }
  return omit(card, ['categories']);
};

const findCategories = (
  cards: LevierCard[],
  levierId: LevierId
): LevierCategorie[] | undefined => findCard(cards, levierId)?.categories;

describe('toLevierCards', () => {
  it("rend les 29 leviers dans l'ordre du domaine", () => {
    const cards = toLevierCards({
      pertinences: [],
      mobilisation: emptyMobilisation,
    });

    expect(cards.map((card) => card.levierId)).toEqual([...levierIdEnumValues]);
  });

  it('lit le secteur du levier à travers son nom', () => {
    const cards = toLevierCards({
      pertinences: [],
      mobilisation: emptyMobilisation,
    });

    expect(
      findCardWithoutCategories(cards, 'captage_methane_isdnd')
    ).toStrictEqual({
      levierId: 'captage_methane_isdnd',
      nom: 'Captage de méthane dans les ISDND',
      secteur: 'Déchets',
      ficheCount: 0,
    });
  });

  it('reprend la pertinence du levier, pas celle de ses catégories', () => {
    const cards = toLevierCards({
      pertinences: [
        { levierId: 'covoiturage', pertinence: 'a_discuter' },
        {
          levierId: 'covoiturage',
          categorie: 'financement',
          pertinence: 'pertinent',
        },
      ],
      mobilisation: emptyMobilisation,
    });

    expect(findCardWithoutCategories(cards, 'covoiturage')).toStrictEqual({
      levierId: 'covoiturage',
      nom: 'Covoiturage',
      secteur: 'Transports',
      ficheCount: 0,
      pertinence: 'a_discuter',
    });
  });

  it('laisse non renseigné un levier dont seule une catégorie est qualifiée', () => {
    const cards = toLevierCards({
      pertinences: [
        {
          levierId: 'biogaz',
          categorie: 'amenagement',
          pertinence: 'pertinent',
        },
      ],
      mobilisation: emptyMobilisation,
    });

    expect(findCardWithoutCategories(cards, 'biogaz')).toStrictEqual({
      levierId: 'biogaz',
      nom: 'Biogaz',
      secteur: 'Branche énergie',
      ficheCount: 0,
    });
  });

  it("compte 0 action pour un levier absent de la grille d'analyse", () => {
    const cards = toLevierCards({
      pertinences: [],
      mobilisation: toMobilisation([
        {
          levierId: 'covoiturage',
          ficheCount: 3,
          volets: [{ categorie: 'amenagement', note: 2, ficheCount: 3 }],
        },
      ]),
    });

    expect(findCard(cards, 'biogaz')?.ficheCount).toBe(0);
  });

  it('reprend le nombre de fiches distinctes du levier calculé par le backend, pas la somme de ses volets', () => {
    const cards = toLevierCards({
      pertinences: [],
      mobilisation: toMobilisation([
        {
          levierId: 'covoiturage',
          ficheCount: 2,
          volets: [
            { categorie: 'amenagement', note: 2, ficheCount: 2 },
            { categorie: 'financement', note: 1, ficheCount: 1 },
          ],
        },
      ]),
    });

    expect(findCard(cards, 'covoiturage')?.ficheCount).toBe(2);
  });

  it("rend les 6 catégories de chaque levier dans l'ordre du domaine", () => {
    const cards = toLevierCards({
      pertinences: [],
      mobilisation: emptyMobilisation,
    });

    expect(
      cards.map((card) => card.categories.map(({ categorie }) => categorie))
    ).toStrictEqual(
      levierIdEnumValues.map(() => [...categorieActionEnumValues])
    );
  });

  it("mobilise une catégorie dès qu'une fiche y est rattachée, note 0 comprise, et compte 0 fiche pour une catégorie absente de la grille", () => {
    const cards = toLevierCards({
      pertinences: [
        {
          levierId: 'covoiturage',
          categorie: 'amenagement',
          pertinence: 'non_pertinent',
        },
      ],
      mobilisation: toMobilisation([
        {
          levierId: 'covoiturage',
          ficheCount: 1,
          volets: [
            { categorie: 'amenagement', note: 0, ficheCount: 1 },
            { categorie: 'financement', note: 1, ficheCount: 0 },
          ],
        },
      ]),
    });

    expect(findCategories(cards, 'covoiturage')).toStrictEqual([
      {
        categorie: 'amenagement',
        ficheCount: 1,
        pertinenceEffective: { kind: 'mobilise' },
      },
      {
        categorie: 'planification',
        ficheCount: 0,
        pertinenceEffective: { kind: 'propre' },
      },
      {
        categorie: 'financement',
        ficheCount: 0,
        pertinenceEffective: { kind: 'propre' },
      },
      {
        categorie: 'gouvernance',
        ficheCount: 0,
        pertinenceEffective: { kind: 'propre' },
      },
      {
        categorie: 'exemplarite',
        ficheCount: 0,
        pertinenceEffective: { kind: 'propre' },
      },
      {
        categorie: 'sensibilisation',
        ficheCount: 0,
        pertinenceEffective: { kind: 'propre' },
      },
    ]);
  });

  it("fait hériter d'un levier non pertinent ses catégories non mobilisées, et garde mobilisées les autres", () => {
    const cards = toLevierCards({
      pertinences: [
        { levierId: 'biogaz', pertinence: 'non_pertinent' },
        {
          levierId: 'biogaz',
          categorie: 'financement',
          pertinence: 'pertinent',
        },
      ],
      mobilisation: toMobilisation([
        {
          levierId: 'biogaz',
          ficheCount: 2,
          volets: [{ categorie: 'gouvernance', note: 2, ficheCount: 2 }],
        },
      ]),
    });

    expect(findCategories(cards, 'biogaz')).toStrictEqual([
      {
        categorie: 'amenagement',
        ficheCount: 0,
        pertinenceEffective: { kind: 'heritee_du_levier' },
      },
      {
        categorie: 'planification',
        ficheCount: 0,
        pertinenceEffective: { kind: 'heritee_du_levier' },
      },
      {
        categorie: 'financement',
        ficheCount: 0,
        pertinenceEffective: { kind: 'heritee_du_levier' },
      },
      {
        categorie: 'gouvernance',
        ficheCount: 2,
        pertinenceEffective: { kind: 'mobilise' },
      },
      {
        categorie: 'exemplarite',
        ficheCount: 0,
        pertinenceEffective: { kind: 'heritee_du_levier' },
      },
      {
        categorie: 'sensibilisation',
        ficheCount: 0,
        pertinenceEffective: { kind: 'heritee_du_levier' },
      },
    ]);
  });

  it("reprend la pertinence propre d'une catégorie quand son levier n'est pas non pertinent", () => {
    const cards = toLevierCards({
      pertinences: [
        { levierId: 'covoiturage', pertinence: 'a_discuter' },
        {
          levierId: 'covoiturage',
          categorie: 'exemplarite',
          pertinence: 'non_pertinent',
        },
      ],
      mobilisation: emptyMobilisation,
    });

    expect(
      findCategories(cards, 'covoiturage')?.find(
        ({ categorie }) => categorie === 'exemplarite'
      )
    ).toStrictEqual({
      categorie: 'exemplarite',
      ficheCount: 0,
      pertinenceEffective: { kind: 'propre', pertinence: 'non_pertinent' },
    });
  });
});

describe('hasMobilisation', () => {
  it('ne voit aucune mobilisation quand la grille est vide', () => {
    expect(hasMobilisation(emptyMobilisation)).toBe(false);
  });

  it('ne voit aucune mobilisation quand les leviers de la grille ne rattachent aucune fiche', () => {
    expect(
      hasMobilisation(
        toMobilisation([
          {
            levierId: 'biogaz',
            ficheCount: 0,
            volets: [{ categorie: 'amenagement', note: 0, ficheCount: 0 }],
          },
        ])
      )
    ).toBe(false);
  });

  it("voit une mobilisation dès qu'un levier de la grille rattache une fiche", () => {
    expect(
      hasMobilisation(
        toMobilisation([
          {
            levierId: 'biogaz',
            ficheCount: 1,
            volets: [{ categorie: 'amenagement', note: 1, ficheCount: 1 }],
          },
        ])
      )
    ).toBe(true);
  });
});
