import { PreuveTypeEnum } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import { updatePreuveInputSchema } from './edit-preuve-document.input';

const preuve = { preuveId: 1, preuveType: PreuveTypeEnum.ANNEXE };

describe('updatePreuveInputSchema', () => {
  it('accepte une modification du seul commentaire', () => {
    const result = updatePreuveInputSchema.safeParse({
      ...preuve,
      commentaire: 'Relu le 12 mars',
    });

    expect(result.success).toBe(true);
  });

  it('refuse une modification qui ne porte ni lien ni commentaire', () => {
    const result = updatePreuveInputSchema.safeParse(preuve);

    expect(result.success).toBe(false);
  });

  it('refuse un lien qui ne respecte pas le contrat', () => {
    const result = updatePreuveInputSchema.safeParse({
      ...preuve,
      lien: { url: 'pas-une-url', titre: '' },
    });

    expect(result.success).toBe(false);
  });
});
