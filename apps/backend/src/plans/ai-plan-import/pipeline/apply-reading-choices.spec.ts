import { describe, expect, it } from 'vitest';
import type { ThemeGroup } from '../models/import-question';
import { applyReadingChoices } from './apply-reading-choices';
import { buildUnit, DocumentUnit } from './segment-document/document-unit';

const unit = (headingPath: string[], text = 'Texte'): DocumentUnit =>
  buildUnit([{ text, pageIndex: 0 }], headingPath, 'fiche');

const groups: ThemeGroup[] = [
  {
    label: 'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
    labelPage: 3,
    variants: [
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
  },
];

const fiche = [
  unit(['BIODECHETS (végétaux)']),
  unit(['BIODECHETS (restes alimentaires)']),
  unit(['DECHETS EN MER']),
  unit([]),
];
const etape = [
  unit(['BIODECHETS (végétaux)', '3 Broyer'], 'A – Broyer'),
  unit(['DECHETS EN MER', '10 Lutter'], 'A – Ramasser'),
];

describe('applyReadingChoices', () => {
  it('réunit les thèmes sous le libellé de la synthèse, aux deux niveaux de lecture', () => {
    const themeGrouping = { grouping: 'grouped' as const, groups };

    const parFiche = applyReadingChoices(fiche, null, { themeGrouping });
    const parEtape = applyReadingChoices(
      fiche,
      { doubts: [], unitsByLevel: { fiche, etape } },
      { actionLevel: 'etape', themeGrouping }
    );

    expect(parFiche?.map(({ headingPath }) => headingPath)).toEqual([
      ['BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX'],
      ['BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX'],
      ['DECHETS EN MER'],
      [],
    ]);
    expect(parEtape?.map(({ headingPath }) => headingPath)).toEqual([
      ['BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX', '3 Broyer'],
      ['DECHETS EN MER', '10 Lutter'],
    ]);
  });

  it('garde les thèmes des fiches quand l’utilisateur les veut séparés', () => {
    const read = applyReadingChoices(fiche, null, {
      themeGrouping: { grouping: 'separate', groups },
    });

    expect(read).toBe(fiche);
  });

  it('lit les unités du niveau choisi, sans autre choix', () => {
    expect(
      applyReadingChoices(
        fiche,
        { doubts: [], unitsByLevel: { fiche, etape } },
        { actionLevel: 'etape' }
      )
    ).toBe(etape);
    expect(applyReadingChoices(null, null, {})).toBeNull();
  });
});
