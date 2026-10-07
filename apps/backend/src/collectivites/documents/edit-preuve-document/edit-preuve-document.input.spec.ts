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

  it('accepte un lien conforme', () => {
    const result = updatePreuveInputSchema.safeParse({
      ...preuve,
      lien: { url: 'https://example.org/note.pdf', titre: 'Une note' },
    });

    expect(result.success).toBe(true);
  });

  it("refuse un lien dont l'url n'est pas du web, même avec un titre valide", () => {
    const result = updatePreuveInputSchema.safeParse({
      ...preuve,
      lien: { url: 'javascript:alert(1)', titre: 'Une note' },
    });

    expect(result.success).toBe(false);
  });

  it('refuse un lien au titre vide, même avec une url valide', () => {
    const result = updatePreuveInputSchema.safeParse({
      ...preuve,
      lien: { url: 'https://example.org/note.pdf', titre: '' },
    });

    expect(result.success).toBe(false);
  });
});
