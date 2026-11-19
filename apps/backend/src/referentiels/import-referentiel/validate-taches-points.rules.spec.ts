import { validateTachesPoints } from './validate-taches-points.rules';

const sousAction = (points: number | null) => ({
  actionId: 'te_2.1.1.7',
  parentId: 'te_2.1.1',
  isTache: false,
  points,
});

const tache = (
  suffix: string,
  { points, pourcentage }: { points?: number; pourcentage?: number } = {}
) => ({
  actionId: `te_2.1.1.7.${suffix}`,
  parentId: 'te_2.1.1.7',
  isTache: true,
  points,
  pourcentage,
});

describe('validateTachesPoints', () => {
  it('Accepte des tâches sans points (répartition équitable)', () => {
    expect(
      validateTachesPoints([sousAction(2.4), tache('a'), tache('b')])
    ).toEqual([]);
  });

  it('Accepte une répartition non équitable des points', () => {
    expect(
      validateTachesPoints([
        sousAction(2.4),
        tache('a', { points: 0.6 }),
        tache('b', { points: 0.6 }),
        tache('c', { points: 1.2 }),
      ])
    ).toEqual([]);
  });

  it('Ne vérifie pas la somme (cas des tâches désactivables)', () => {
    expect(
      validateTachesPoints([
        sousAction(1.2),
        tache('a', { points: 1.2 }),
        tache('b', { points: 1.2 }),
      ])
    ).toEqual([]);
  });

  it('Refuse des points renseignés sur une partie seulement des tâches', () => {
    expect(
      validateTachesPoints([
        sousAction(2.4),
        tache('a', { points: 1.2 }),
        tache('b', { points: 1.2 }),
        tache('c'),
      ])
    ).toEqual([
      'Les tâches de te_2.1.1.7 doivent toutes avoir des points (manquant pour : te_2.1.1.7.c)',
    ]);
  });

  it('Refuse le mélange de points et de pourcentages', () => {
    expect(
      validateTachesPoints([
        sousAction(2.4),
        tache('a', { points: 1.2 }),
        tache('b', { pourcentage: 50 }),
      ])
    ).toEqual(['Les tâches de te_2.1.1.7 mélangent points et pourcentages']);
  });
});
