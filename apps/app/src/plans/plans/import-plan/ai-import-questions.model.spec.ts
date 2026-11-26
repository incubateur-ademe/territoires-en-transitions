import { describe, expect, it } from 'vitest';
import {
  actionLevelDoubt,
  actionsWithoutFicheDoubt,
  themeGroupingDoubt,
} from './ai-import-questions.fixture';
import {
  answerTrackingProperties,
  choicesToSend,
  proposedChoicesOf,
} from './ai-import-questions.model';

const doubts = [actionLevelDoubt, themeGroupingDoubt, actionsWithoutFicheDoubt];

describe('proposedChoicesOf', () => {
  it('coche la réponse proposée de chaque question', () => {
    expect(proposedChoicesOf(doubts)).toEqual({
      'action-level': { kind: 'action-level', actionLevel: 'fiche' },
      'theme-grouping': { kind: 'theme-grouping', grouping: 'grouped' },
      'actions-without-fiche': {
        kind: 'actions-without-fiche',
        actions: 'all',
      },
    });
  });
});

describe('choicesToSend', () => {
  it('envoie un choix par question posée, dans leur ordre', () => {
    expect(
      choicesToSend([themeGroupingDoubt, actionLevelDoubt], {
        'action-level': { kind: 'action-level', actionLevel: 'etape' },
        'theme-grouping': { kind: 'theme-grouping', grouping: 'separate' },
      })
    ).toEqual([
      { kind: 'theme-grouping', grouping: 'separate' },
      { kind: 'action-level', actionLevel: 'etape' },
    ]);
  });

  it('retombe sur la réponse proposée et ignore une question non posée', () => {
    expect(
      choicesToSend([actionsWithoutFicheDoubt], {
        'action-level': { kind: 'action-level', actionLevel: 'etape' },
      })
    ).toEqual([{ kind: 'actions-without-fiche', actions: 'all' }]);
  });
});

describe('answerTrackingProperties', () => {
  it('compte les questions et les réponses changées, garde le niveau de l’action', () => {
    expect(
      answerTrackingProperties(doubts, [
        { kind: 'action-level', actionLevel: 'fiche' },
        { kind: 'theme-grouping', grouping: 'separate' },
        { kind: 'actions-without-fiche', actions: 'with-fiche' },
      ])
    ).toEqual({
      questionKinds: [
        'action-level',
        'theme-grouping',
        'actions-without-fiche',
      ],
      questionCount: 3,
      changedKinds: ['theme-grouping', 'actions-without-fiche'],
      actionLevel: 'fiche',
      proposed: 'fiche',
    });
  });

  it('ne parle pas du niveau de l’action quand la question ne le pose pas', () => {
    expect(
      answerTrackingProperties(
        [themeGroupingDoubt],
        [{ kind: 'theme-grouping', grouping: 'grouped' }]
      )
    ).toEqual({
      questionKinds: ['theme-grouping'],
      questionCount: 1,
      changedKinds: [],
    });
  });
});
