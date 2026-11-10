import { describe, expect, it } from 'vitest';
import { getSecteursNonRepresentes } from './secteurs-non-representes.utils';

const secteur = (
  nom: string,
  valeurs: Partial<{
    resultat2019: number | null;
    objectif2019: number | null;
    objectif2030: number | null;
  }>
) => ({
  nom,
  resultat2019: null,
  objectif2019: null,
  objectif2030: null,
  ...valeurs,
});

describe('getSecteursNonRepresentes', () => {
  it('garde les secteurs qui ont une base et un objectif 2030', () => {
    expect(
      getSecteursNonRepresentes([
        secteur('Résidentiel', { resultat2019: 120, objectif2030: 80 }),
        secteur('Transports', { objectif2019: 300, objectif2030: 200 }),
      ])
    ).toEqual([]);
  });

  it('liste les secteurs sans base ou sans objectif 2030, dans l’ordre reçu', () => {
    expect(
      getSecteursNonRepresentes([
        secteur('Résidentiel', { resultat2019: 120, objectif2030: 80 }),
        secteur('Branche énergie', { objectif2030: 10 }),
        secteur('Déchets', { objectif2019: 40 }),
      ])
    ).toEqual(['Branche énergie', 'Déchets']);
  });

  it('suit le package : une base ou un objectif à zéro écarte le secteur', () => {
    expect(
      getSecteursNonRepresentes([
        secteur('Agriculture', { objectif2019: 0, objectif2030: 50 }),
        secteur('Industrie', { objectif2019: 50, objectif2030: 0 }),
      ])
    ).toEqual(['Agriculture', 'Industrie']);
  });
});
