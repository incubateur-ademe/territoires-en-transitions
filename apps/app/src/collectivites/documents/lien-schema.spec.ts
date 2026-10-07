import { appLabels } from '@/app/labels/catalog';
import { describe, expect, it } from 'vitest';
import { lienFormSchema } from './lien-schema';

const url = 'https://example.org/note.pdf';

const messageDu = (field: 'titre' | 'url', value: Record<string, string>) =>
  lienFormSchema
    .safeParse(value)
    .error?.issues.find((issue) => issue.path[0] === field)?.message;

describe('lienFormSchema', () => {
  it("retire les espaces autour de l'url collée", () => {
    const result = lienFormSchema.safeParse({
      titre: 'Une note',
      url: `  ${url}  `,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ titre: 'Une note', url });
  });

  it('retire les espaces autour du titre', () => {
    const result = lienFormSchema.safeParse({ titre: '  Une note  ', url });

    expect(result.data).toEqual({ titre: 'Une note', url });
  });

  it('signale un titre vide par le libellé du catalogue', () => {
    expect(messageDu('titre', { titre: '   ', url })).toBe(
      appLabels.validationTitreLienRequis
    );
  });

  it('signale une url hors du web par le libellé du catalogue', () => {
    expect(
      messageDu('url', { titre: 'Une note', url: 'javascript:alert(1)' })
    ).toBe(appLabels.validationLienValide);
  });
});
