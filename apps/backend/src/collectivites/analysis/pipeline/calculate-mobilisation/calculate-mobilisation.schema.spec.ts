import { categorieActionEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { CATEGORIE_RANKS } from './volet-categories';
import { mobilisationResponseSchema } from './calculate-mobilisation.schema';

describe('mobilisationResponseSchema', () => {
  it('attend une note par rang de categorie, dans l ordre du prompt', () => {
    expect(Object.keys(mobilisationResponseSchema.shape)).toEqual(
      categorieActionEnumValues.map((categorie) => CATEGORIE_RANKS[categorie])
    );
  });

  it('refuse une reponse dont une categorie manque', () => {
    const result = mobilisationResponseSchema.safeParse({
      '1': 3,
      '2': 2,
      '3': 1,
      '4': 0,
      '5': 0,
    });

    expect(result.success).toBe(false);
  });

  it("refuse une note hors de l'echelle de 0 a 3", () => {
    const result = mobilisationResponseSchema.safeParse({
      '1': 4,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
    });

    expect(result.success).toBe(false);
  });
});
