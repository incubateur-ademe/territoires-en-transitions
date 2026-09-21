import { toLevierRank } from '../../prompts/levier-ranks';
import {
  categorieActionEnumValues,
  levierEnumValues,
} from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { classificationResponseSchema } from './classify-fiches.schema';

describe('classificationResponseSchema', () => {
  it('rejette un rang de levier hors du referentiel', () => {
    const result = classificationResponseSchema.safeParse([
      {
        index: 0,
        justification: 'Justification',
        hasNoRelevantLevier: false,
        volets: [
          {
            levier: levierEnumValues.length + 1,
            categories: [categorieActionEnumValues.indexOf('amenagement') + 1],
          },
        ],
      },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejette un levier annoncé sans aucune catégorie', () => {
    const result = classificationResponseSchema.safeParse([
      {
        index: 0,
        justification: 'Justification',
        hasNoRelevantLevier: false,
        volets: [{ levier: toLevierRank('Covoiturage'), categories: [] }],
      },
    ]);
    expect(result.success).toBe(false);
  });
});
