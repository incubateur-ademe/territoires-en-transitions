import { levierIdEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ficheClassificationSchema } from './classify-fiche.schema';

describe('ficheClassificationSchema', () => {
  it('accepte une fiche sans levier', () => {
    expect(ficheClassificationSchema.safeParse({ leviers: [] }).success).toBe(
      true
    );
  });

  it('accepte un levier avec plusieurs catégories', () => {
    expect(
      ficheClassificationSchema.parse({
        leviers: [{ levier: 'covoiturage', categories: [1, 3] }],
      })
    ).toEqual({ leviers: [{ levier: 'covoiturage', categories: [1, 3] }] });
  });

  it('refuse un code de levier inconnu', () => {
    expect(
      ficheClassificationSchema.safeParse({
        leviers: [{ levier: 'Covoiturage', categories: [1] }],
      }).success
    ).toBe(false);
  });

  it('refuse un levier sans catégorie', () => {
    expect(
      ficheClassificationSchema.safeParse({
        leviers: [{ levier: 'covoiturage', categories: [] }],
      }).success
    ).toBe(false);
  });

  it.each([0, 7, 1.5])('refuse la catégorie %s', (categorie) => {
    expect(
      ficheClassificationSchema.safeParse({
        leviers: [{ levier: 'covoiturage', categories: [categorie] }],
      }).success
    ).toBe(false);
  });

  it('se décrit en JSON Schema avec les codes de leviers et les six catégories', () => {
    const jsonSchema = z.toJSONSchema(ficheClassificationSchema);

    expect(jsonSchema).toMatchObject({
      type: 'object',
      required: ['leviers'],
      additionalProperties: false,
      properties: {
        leviers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['levier', 'categories'],
            additionalProperties: false,
            properties: {
              levier: { enum: [...levierIdEnumValues] },
              categories: {
                type: 'array',
                minItems: 1,
                items: { enum: [1, 2, 3, 4, 5, 6] },
              },
            },
          },
        },
      },
    });
  });
});
