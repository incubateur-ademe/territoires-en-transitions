import { describe, expect, it } from 'vitest';
import { makeDemarcheSectionUrl } from './steps';

describe('makeDemarcheSectionUrl', () => {
  const ids = { collectiviteId: 1, demarcheId: 42 };

  it('pointe vers les pages des trois sous-étapes', () => {
    expect(makeDemarcheSectionUrl('documents', ids)).toBe(
      '/collectivite/1/demarche-pcaet/42/documents'
    );
    expect(makeDemarcheSectionUrl('diagnostic', ids)).toBe(
      '/collectivite/1/demarche-pcaet/42/indicateurs'
    );
    expect(makeDemarcheSectionUrl('plan', ids)).toBe(
      '/collectivite/1/demarche-pcaet/42/plan'
    );
  });
});
