import { normalizeIndicateurReferenceObjectifs } from './indicateur-reference-objectif.rules';

describe('normalizeIndicateurReferenceObjectifs', () => {
  it('conserve le dernier objectif de chaque année et sa valeur zéro sans modifier les entrées', () => {
    const objectifs = Object.freeze([
      { dateValeur: '2030-12-31', valeur: 0 },
      { dateValeur: '2025-06-30', valeur: 10 },
      { dateValeur: '2030-01-01', valeur: 20 },
    ]);

    expect(normalizeIndicateurReferenceObjectifs(objectifs)).toEqual([
      {
        horizon: { periodicite: 'annuelle', dateDebut: '2025-01-01' },
        valeur: 10,
      },
      {
        horizon: { periodicite: 'annuelle', dateDebut: '2030-01-01' },
        valeur: 0,
      },
    ]);
    expect(objectifs[0].dateValeur).toBe('2030-12-31');
  });
});
