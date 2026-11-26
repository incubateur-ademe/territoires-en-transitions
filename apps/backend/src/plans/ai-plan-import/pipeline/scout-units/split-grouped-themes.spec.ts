import { describe, expect, it } from 'vitest';
import type { ThemeGroup } from '../../models/import-question';
import type { PlanSkeleton } from '../../models/plan-skeleton';
import { splitGroupedThemes } from './split-grouped-themes';

const biodechets: ThemeGroup = {
  label: 'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
  labelPage: 3,
  variants: [
    {
      theme: 'BIODECHETS (restes alimentaires et végétaux)',
      fiches: 2,
      exampleTitle: '1 Composter',
      page: 24,
    },
    {
      theme: 'BIODECHETS (végétaux)',
      fiches: 1,
      exampleTitle: '3 Broyer',
      page: 28,
    },
    {
      theme: 'BIODECHETS (restes alimentaires)',
      fiches: 1,
      exampleTitle: '4 Lutter',
      page: 31,
    },
  ],
};

const axe = (numero: string, titre: string, sousAxes: string[] = []) => ({
  numero,
  titre,
  sousAxes: sousAxes.map((sousAxe, index) => ({
    numero: `${numero}.${index + 1}`,
    titre: sousAxe,
  })),
});

const titres = (skeleton: PlanSkeleton) =>
  skeleton.axes.map(({ numero, titre }) => `${numero} ${titre}`);

describe('splitGroupedThemes', () => {
  it('redécoupe l’axe qui réunit les thèmes, à sa place, et renumérote', () => {
    // Le libellé de la synthèse a les mots du premier thème : l'axe le garde.
    const skeleton = splitGroupedThemes(
      {
        axes: [
          axe('1', 'Biodéchets : restes alimentaires et végétaux'),
          axe('2', 'Déchets en mer', ['Ramasser', 'Sensibiliser']),
        ],
      },
      [biodechets]
    );

    expect(titres(skeleton)).toEqual([
      '1 Biodéchets : restes alimentaires et végétaux',
      '2 BIODECHETS (végétaux)',
      '3 BIODECHETS (restes alimentaires)',
      '4 Déchets en mer',
    ]);
    expect(skeleton.axes[3].sousAxes.map(({ numero }) => numero)).toEqual([
      '4.1',
      '4.2',
    ]);
  });

  it('reconnaît l’axe réuni à la seule tête des thèmes, et reprend la graphie des axes déjà là', () => {
    const skeleton = splitGroupedThemes(
      {
        axes: [
          axe('1', 'Biodéchets'),
          axe('2', 'Déchets en mer'),
          axe('3', 'Biodéchets (végétaux)'),
        ],
      },
      [biodechets]
    );

    expect(titres(skeleton)).toEqual([
      '1 BIODECHETS (restes alimentaires et végétaux)',
      '2 Biodéchets (végétaux)',
      '3 BIODECHETS (restes alimentaires)',
      '4 Déchets en mer',
    ]);
  });

  it('laisse le squelette qui sépare déjà chaque thème', () => {
    const skeleton: PlanSkeleton = {
      axes: [
        axe('1', 'Biodéchets (restes alimentaires et végétaux)'),
        axe('2', 'Biodéchets (végétaux)'),
        axe('3', 'Biodéchets (restes alimentaires)'),
      ],
    };

    expect(splitGroupedThemes(skeleton, [biodechets])).toEqual(skeleton);
  });

  it('laisse le squelette sans axe qui réunisse les thèmes', () => {
    const skeleton: PlanSkeleton = { axes: [axe('A', 'Déchets en mer')] };

    expect(splitGroupedThemes(skeleton, [biodechets])).toEqual(skeleton);
  });
});
