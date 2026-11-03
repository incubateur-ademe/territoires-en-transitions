import { describe, expect, it } from 'vitest';
import { FicheClassification } from './classify-fiche.schema';
import { toClassifiedFiche } from './to-classified-fiche.rules';

const rendered = { ficheId: 7, isDescriptionTruncated: false };

const classify = (leviers: FicheClassification['leviers']) =>
  toClassifiedFiche({ leviers }, rendered);

describe('toClassifiedFiche', () => {
  it('rend une fiche sans volet quand aucun levier ne convient', () => {
    expect(classify([])).toEqual({
      ficheId: 7,
      isDescriptionTruncated: false,
      volets: [],
    });
  });

  it('reporte la troncature de la description', () => {
    expect(
      toClassifiedFiche({ leviers: [] }, { ...rendered, isDescriptionTruncated: true })
        .isDescriptionTruncated
    ).toBe(true);
  });

  it('traduit le code du levier en libellé et le rang en catégorie', () => {
    expect(
      classify([{ levier: 'vehicules_electriques', categories: [1, 3] }]).volets
    ).toEqual([
      { levier: 'Véhicules électriques', categorie: 'amenagement' },
      { levier: 'Véhicules électriques', categorie: 'financement' },
    ]);
  });

  it.each([
    [1, 'amenagement'],
    [2, 'planification'],
    [3, 'financement'],
    [4, 'gouvernance'],
    [5, 'exemplarite'],
    [6, 'sensibilisation'],
  ] as const)('traduit le rang %i en %s', (rank, categorie) => {
    expect(
      classify([{ levier: 'covoiturage', categories: [rank] }]).volets
    ).toEqual([{ levier: 'Covoiturage', categorie }]);
  });

  it('fusionne les catégories d’un levier cité deux fois', () => {
    expect(
      classify([
        { levier: 'covoiturage', categories: [1] },
        { levier: 'covoiturage', categories: [1, 3] },
      ]).volets
    ).toEqual([
      { levier: 'Covoiturage', categorie: 'amenagement' },
      { levier: 'Covoiturage', categorie: 'financement' },
    ]);
  });

  it('garde les trois premiers leviers distincts', () => {
    const levierNoms = classify([
      { levier: 'covoiturage', categories: [1] },
      { levier: 'biogaz', categories: [1] },
      { levier: 'gestion_haies', categories: [6] },
      { levier: 'prevention_dechets', categories: [1] },
    ]).volets.map(({ levier }) => levier);

    expect(levierNoms).toEqual(['Covoiturage', 'Biogaz', 'Gestion des haies']);
  });

  it('compte un levier cité deux fois pour un seul des trois', () => {
    const levierNoms = classify([
      { levier: 'covoiturage', categories: [1] },
      { levier: 'covoiturage', categories: [3] },
      { levier: 'biogaz', categories: [1] },
      { levier: 'gestion_haies', categories: [6] },
    ]).volets.map(({ levier }) => levier);

    expect(levierNoms).toEqual([
      'Covoiturage',
      'Covoiturage',
      'Biogaz',
      'Gestion des haies',
    ]);
  });
});
