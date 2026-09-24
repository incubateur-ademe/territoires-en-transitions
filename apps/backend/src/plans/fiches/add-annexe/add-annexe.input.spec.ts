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

  it('refuse une annexe dont le lien ne respecte pas le contrat', () => {
    const result = addAnnexeInputSchema.safeParse({
      ficheId,
      lien: { url: 'pas-une-url', titre: '' },
    });

    expect(result.success).toBe(false);
  });
});
