import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  classificationResponseSchema,
  FicheClassification,
  MAX_JUSTIFICATION_LENGTH,
} from './classify-fiches.schema';

type ParsedResponse = z.ZodSafeParseResult<FicheClassification[]>;

const toClassificationResponse = (
  justification: string
): FicheClassification[] => [
  {
    index: 0,
    justification,
    hasNoRelevantLevier: false,
    volets: [{ levier: 'Covoiturage', categories: ['amenagement'] }],
  },
];

const parse = (justification: string): ParsedResponse =>
  classificationResponseSchema.safeParse(
    toClassificationResponse(justification)
  );

describe('classificationResponseSchema', () => {
  it('rejette une justification vide', () => {
    expect(parse('').success).toBe(false);
  });

  it('rejette une justification faite de seules espaces', () => {
    expect(parse('   ').success).toBe(false);
  });

  it('retire les espaces de bord de la justification', () => {
    const result = parse('  Le texte décrit du covoiturage.  ');
    expect(result.success && result.data[0].justification).toBe(
      'Le texte décrit du covoiturage.'
    );
  });

  it('rejette une justification de 501 caractères', () => {
    expect(parse('a'.repeat(MAX_JUSTIFICATION_LENGTH + 1)).success).toBe(false);
  });

  it('rejette un levier hors du référentiel', () => {
    const result = classificationResponseSchema.safeParse([
      {
        index: 0,
        justification: 'Justification',
        hasNoRelevantLevier: false,
        volets: [{ levier: 'Téléportation', categories: ['amenagement'] }],
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
        volets: [{ levier: 'Covoiturage', categories: [] }],
      },
    ]);
    expect(result.success).toBe(false);
  });
});
