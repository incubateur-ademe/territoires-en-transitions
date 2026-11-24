import { describe, expect, it } from 'vitest';
import { declaresSurface, lintDeclaration } from './lint-declarations.ts';

const rulesOf = (property: string, value: string) =>
  lintDeclaration({ property, value }).map(({ rule }) => rule);

describe('R2 : le parent porte l’espacement', () => {
  it('refuse une marge non nulle', () => {
    expect(rulesOf('margin-top', '16px')).toEqual(['R2']);
    expect(rulesOf('margin', '0 8px')).toEqual(['R2']);
  });

  it('accepte une marge nulle et le centrage', () => {
    expect(rulesOf('margin', '0')).toEqual([]);
    expect(rulesOf('margin', '0 auto')).toEqual([]);
  });
});

describe('R3 : espacements sur l’échelle', () => {
  it('accepte chaque pas de l’échelle, en px comme en rem', () => {
    expect(rulesOf('gap', '16px')).toEqual([]);
    expect(rulesOf('padding', '0.5rem 1.5rem')).toEqual([]);
    expect(rulesOf('row-gap', '0')).toEqual([]);
  });

  it('refuse 12px et propose les deux pas voisins', () => {
    expect(lintDeclaration({ property: 'gap', value: '12px' })).toEqual([
      {
        rule: 'R3',
        message:
          "gap : 12px est hors de l'échelle 0, 4, 8, 16, 24, 32 px (le plus proche : 8px ou 16px)",
      },
    ]);
  });

  it('propose un seul pas au-delà de l’échelle', () => {
    expect(
      lintDeclaration({ property: 'padding', value: '40px' })[0]?.message
    ).toContain('le plus proche : 32px)');
  });

  it('signale chaque valeur hors échelle d’un raccourci', () => {
    expect(rulesOf('padding', '12px 16px 20px')).toEqual(['R3', 'R3']);
  });

  it('refuse une couleur en dur, même dans une bordure', () => {
    expect(rulesOf('color', '#3a3a3a')).toEqual(['R3']);
    expect(rulesOf('border', '1px solid rgb(0, 0, 0)')).toEqual(['R3']);
    expect(rulesOf('background-color', 'var(--primary-2)')).toEqual([]);
  });

  it('refuse un rayon ou une ombre qui n’est pas un token', () => {
    expect(rulesOf('border-radius', '8px')).toEqual(['R3']);
    expect(rulesOf('box-shadow', '0 2px 4px #000')).toEqual(['R3']);
    expect(rulesOf('border-radius', 'var(--radius-lg)')).toEqual([]);
    expect(rulesOf('box-shadow', 'none')).toEqual([]);
  });
});

describe('R4 : la typographie vient de la balise ou de la classe', () => {
  it('refuse taille, graisse, interligne et police écrites à la main', () => {
    expect(rulesOf('font-size', '18px')).toEqual(['R4']);
    expect(rulesOf('font-weight', '700')).toEqual(['R4']);
    expect(rulesOf('line-height', '1.5')).toEqual(['R4']);
    expect(rulesOf('font-family', 'Arial, sans-serif')).toEqual(['R4']);
  });

  it('accepte la police du design system', () => {
    expect(rulesOf('font-family', 'var(--font-sans)')).toEqual([]);
  });
});

describe('valeurs dynamiques', () => {
  it('ne juge pas une valeur qui vient d’un trou {{ }}', () => {
    expect(rulesOf('gap', '{{ space }}')).toEqual([]);
  });
});

describe('declaresSurface', () => {
  it('repère un rayon ou une ombre déclarés', () => {
    expect(
      declaresSurface({ property: 'border-radius', value: 'var(--radius-lg)' })
    ).toBe(true);
    expect(declaresSurface({ property: 'box-shadow', value: 'none' })).toBe(
      false
    );
    expect(declaresSurface({ property: 'gap', value: '8px' })).toBe(false);
  });
});
