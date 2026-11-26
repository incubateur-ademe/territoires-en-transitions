import { appLabels } from '@/app/labels/catalog';
import { describe, expect, it } from 'vitest';
import { importStatusBadgeOf, importStatusLabels } from './ai-import.labels';

const report = { issues: [], qualitativeReview: null };

describe('importStatusBadgeOf', () => {
  it('montre un abandon motivé en orange, pas comme un échec', () => {
    expect(
      importStatusBadgeOf({
        status: 'failed',
        report: {
          ...report,
          abandon: {
            motif: 'aucune-action',
            evidence: [{ citation: 'Synthèse des enjeux', page: 2 }],
            explanation: '',
          },
        },
      })
    ).toEqual({
      title: appLabels.importPlanIaAbandonCourt,
      variant: 'warning',
    });
  });

  it.each([
    ['failed', 'error'],
    ['done', 'success'],
    ['awaiting_answer', 'warning'],
    ['running', 'info'],
    ['pending', 'info'],
  ] as const)('garde le badge du statut %s', (status, variant) => {
    expect(importStatusBadgeOf({ status, report })).toEqual({
      title: importStatusLabels[status],
      variant,
    });
  });
});
