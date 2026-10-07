import { describe, expect, it } from 'vitest';
import { addAnnexeInputSchema } from './add-annexe.input';

const ficheId = 1;

describe('addAnnexeInputSchema', () => {
  it('accepte une annexe qui porte un fichier', () => {
    const result = addAnnexeInputSchema.safeParse({ ficheId, fichierId: 10 });

    expect(result.success).toBe(true);
  });

  it('accepte une annexe qui porte un lien conforme', () => {
    const result = addAnnexeInputSchema.safeParse({
      ficheId,
      lien: { url: 'https://example.org/note.pdf', titre: 'Une note' },
    });

    expect(result.success).toBe(true);
  });

  it("refuse une annexe dont l'url n'est pas du web, même avec un titre valide", () => {
    const result = addAnnexeInputSchema.safeParse({
      ficheId,
      lien: { url: 'javascript:alert(1)', titre: 'Une note' },
    });

    expect(result.success).toBe(false);
  });

  it('refuse une annexe au titre vide, même avec une url valide', () => {
    const result = addAnnexeInputSchema.safeParse({
      ficheId,
      lien: { url: 'https://example.org/note.pdf', titre: '' },
    });

    expect(result.success).toBe(false);
  });
});
