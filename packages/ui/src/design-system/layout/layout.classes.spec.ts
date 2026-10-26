import { describe, expect, it } from 'vitest';
import {
  alignments,
  boxClasses,
  columnCounts,
  gridClasses,
  inlineClasses,
  justifications,
  listLayoutClasses,
  stackClasses,
} from './layout.classes';
import { breakpoints, spacings, toResponsiveEntries } from './layout.tokens';

const splitClasses = (classes: string): ReadonlyArray<string> =>
  classes.split(' ').filter(Boolean);

describe('toResponsiveEntries', () => {
  it('renvoie une entrée sans préfixe pour une valeur fixe', () => {
    expect(toResponsiveEntries('md')).toEqual([{ prefix: '', value: 'md' }]);
  });

  it('ordonne les points de rupture en mobile first, base en tête', () => {
    expect(toResponsiveEntries({ lg: 'xl', base: 'sm', md: 'md' })).toEqual([
      { prefix: '', value: 'sm' },
      { prefix: 'md:', value: 'md' },
      { prefix: 'lg:', value: 'xl' },
    ]);
  });

  it('ne renvoie rien sans valeur', () => {
    expect(toResponsiveEntries(undefined)).toEqual([]);
  });
});

describe('stackClasses', () => {
  it("empile en colonne avec l'espacement md par défaut", () => {
    expect(stackClasses({})).toBe('flex flex-col gap-4');
  });

  it("traduit l'échelle sémantique en classes Tailwind", () => {
    expect(stackClasses({ gap: 'xs' })).toBe('flex flex-col gap-1');
    expect(stackClasses({ gap: 'xl' })).toBe('flex flex-col gap-8');
    expect(stackClasses({ gap: 'none' })).toBe('flex flex-col gap-0');
  });

  it('applique un espacement et un alignement responsives', () => {
    expect(
      stackClasses({ gap: { base: 'sm', lg: 'lg' }, align: 'center' })
    ).toBe('flex flex-col gap-2 lg:gap-6 items-center');
  });
});

describe('inlineClasses', () => {
  it("aligne en ligne avec retour à la ligne et l'espacement sm par défaut", () => {
    expect(inlineClasses({})).toBe('flex flex-row flex-wrap gap-2');
  });

  it('désactive le retour à la ligne', () => {
    expect(inlineClasses({ wrap: false })).toBe('flex flex-row gap-2');
  });

  it('empile en colonne sous le point de rupture de repli', () => {
    expect(inlineClasses({ collapseBelow: 'md' })).toBe(
      'flex flex-col md:flex-row flex-wrap gap-2'
    );
  });

  it("n'aligne et ne justifie qu'en ligne quand il se replie", () => {
    expect(
      inlineClasses({
        collapseBelow: 'md',
        align: 'center',
        justify: { base: 'between', xl: 'start' },
      })
    ).toBe(
      'flex flex-col md:flex-row flex-wrap gap-2 md:items-center md:justify-between xl:justify-start'
    );
  });
});

describe('gridClasses', () => {
  it('répartit en colonnes responsives', () => {
    expect(gridClasses({ columns: { base: 1, md: 3 } })).toBe(
      'grid grid-cols-1 md:grid-cols-3 gap-4'
    );
  });
});

describe('boxClasses', () => {
  it("n'ajoute aucune classe sans padding", () => {
    expect(boxClasses({})).toBe('');
  });

  it('combine padding global et par axe', () => {
    expect(boxClasses({ padding: 'md', paddingX: { md: 'lg' } })).toBe(
      'p-4 md:px-6'
    );
  });
});

describe('listLayoutClasses', () => {
  const safelist = new Set(listLayoutClasses());

  const everyResponsive = <T>(values: ReadonlyArray<T>) =>
    values.flatMap((value) => [
      value,
      Object.fromEntries(breakpoints.map((breakpoint) => [breakpoint, value])),
    ]);

  // Les classes non préfixées et sans valeur (`flex`, `grid`…) sont écrites
  // en toutes lettres dans le source : le scan de Tailwind les trouve seul.
  const staticClasses = new Set([
    'flex',
    'flex-col',
    'flex-row',
    'flex-wrap',
    'grid',
  ]);

  const producedClasses = [
    ...everyResponsive(spacings).flatMap((spacing) => [
      stackClasses({ gap: spacing }),
      boxClasses({ padding: spacing, paddingX: spacing, paddingY: spacing }),
    ]),
    ...everyResponsive(alignments).map((align) => stackClasses({ align })),
    ...everyResponsive(justifications).map((justify) =>
      inlineClasses({ justify })
    ),
    ...everyResponsive(columnCounts).map((columns) => gridClasses({ columns })),
    ...breakpoints.map((collapseBelow) => inlineClasses({ collapseBelow })),
  ].flatMap(splitClasses);

  it('contient toutes les classes dynamiques que les primitives produisent', () => {
    const missing = producedClasses.filter(
      (className) => !staticClasses.has(className) && !safelist.has(className)
    );
    expect(missing).toEqual([]);
  });

  it('ne contient pas de doublon', () => {
    expect(safelist.size).toBe(listLayoutClasses().length);
  });
});
