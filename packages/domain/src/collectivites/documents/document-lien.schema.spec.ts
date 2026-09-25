import { describe, expect, it } from 'vitest';
import { lienInputSchema } from './document-lien.schema';

const url = 'https://example.org/note.pdf';

describe('lienInputSchema', () => {
  it('accepte une url http et un titre', () => {
    expect(lienInputSchema.safeParse({ url, titre: 'Une note' }).success).toBe(
      true
    );
  });

  it('normalise le titre en retirant les espaces de bord', () => {
    const result = lienInputSchema.safeParse({ url, titre: '  Une note  ' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ url, titre: 'Une note' });
  });

  it('refuse un titre vide', () => {
    expect(lienInputSchema.safeParse({ url, titre: '' }).success).toBe(false);
  });

  it("refuse un titre qui n'est fait que d'espaces", () => {
    expect(lienInputSchema.safeParse({ url, titre: '   ' }).success).toBe(
      false
    );
  });

  it("refuse une chaîne qui n'est pas une url", () => {
    expect(
      lienInputSchema.safeParse({ url: 'pas-une-url', titre: 'Une note' })
        .success
    ).toBe(false);
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd'])(
    'refuse le protocole de %s, qui finirait dans un window.open',
    (url) => {
      expect(
        lienInputSchema.safeParse({ url, titre: 'Une note' }).success
      ).toBe(false);
    }
  );
});
