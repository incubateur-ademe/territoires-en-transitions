import { describe, expect, it } from 'vitest';
import { countPlanContent } from './count-plan-content';

const fiche = (titre: string, axisPath?: string[]) => ({ titre, axisPath });

describe('countPlanContent', () => {
  it('compte les axes et sous-axes distincts et toutes les fiches', () => {
    // Une sous-action compte comme une fiche : même axisPath que son parent.
    const sousFiche = {
      ...fiche('A.1', ['Mobilité', 'Vélo']),
      parentActionTitre: 'A',
    };
    const recap = countPlanContent({
      actions: [
        fiche('A', ['Mobilité', 'Vélo']),
        sousFiche,
        fiche('B', ['Mobilité', 'Bus']),
        fiche('C', ['Énergie', 'Vélo']),
        fiche('D'),
      ],
    });

    expect(recap).toEqual({ axesCount: 2, sousAxesCount: 3, fichesCount: 5 });
  });
});
