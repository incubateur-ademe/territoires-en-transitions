import { LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import {
  hasMobilisation,
  LevierCard,
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

    expect(findCard(cards, 'captage_methane_isdnd')).toStrictEqual({
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

    expect(findCard(cards, 'covoiturage')).toStrictEqual({
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

    expect(findCard(cards, 'biogaz')).toStrictEqual({
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
