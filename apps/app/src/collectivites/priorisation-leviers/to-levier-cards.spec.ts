import { LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { LevierCard, toLevierCards } from './to-levier-cards';

const findCard = (
  cards: LevierCard[],
  levierId: LevierId
): LevierCard | undefined => cards.find((card) => card.levierId === levierId);

describe('toLevierCards', () => {
  it("rend les 29 leviers dans l'ordre du domaine", () => {
    const cards = toLevierCards({ pertinences: [] });

    expect(cards.map((card) => card.levierId)).toEqual([...levierIdEnumValues]);
  });

  it('lit le secteur du levier à travers son nom', () => {
    const cards = toLevierCards({ pertinences: [] });

    expect(findCard(cards, 'captage_methane_isdnd')).toStrictEqual({
      levierId: 'captage_methane_isdnd',
      nom: 'Captage de méthane dans les ISDND',
      secteur: 'Déchets',
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
    });

    expect(findCard(cards, 'covoiturage')).toStrictEqual({
      levierId: 'covoiturage',
      nom: 'Covoiturage',
      secteur: 'Transports',
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
    });

    expect(findCard(cards, 'biogaz')).toStrictEqual({
      levierId: 'biogaz',
      nom: 'Biogaz',
      secteur: 'Branche énergie',
    });
  });
});
