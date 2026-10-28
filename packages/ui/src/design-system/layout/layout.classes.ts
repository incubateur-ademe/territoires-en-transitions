import {
  Breakpoint,
  breakpoints,
  Responsive,
  Spacing,
  spacings,
  spacingScale,
  toResponsiveEntries,
} from './layout.tokens';

/*
 * Calcul pur des classes Tailwind des primitives de layout.
 *
 * Les classes sont construites dynamiquement (`md:gap-4`), donc invisibles au
 * scan de contenu de Tailwind : `listLayoutClasses` énumère toutes celles que
 * ces fonctions peuvent produire, et le preset les place en `safelist`. Une
 * seule source de vérité, sans table de classes à maintenir à la main.
 *
 * Ce fichier est chargé par la config Tailwind (Node) : il ne doit importer ni
 * React ni rien qui en dépende.
 */

export const alignments = [
  'start',
  'center',
  'end',
  'stretch',
  'baseline',
] as const;
export type Align = (typeof alignments)[number];

export const justifications = ['start', 'center', 'end', 'between'] as const;
export type Justify = (typeof justifications)[number];

export const columnCounts = [1, 2, 3, 4, 5, 6] as const;
export type Columns = (typeof columnCounts)[number];

/** Une prop de layout : ses valeurs possibles et la classe de chacune. */
type ClassFamily<T extends string | number> = Readonly<{
  values: ReadonlyArray<T>;
  toClass: (value: T) => string;
}>;

const gapFamily: ClassFamily<Spacing> = {
  values: spacings,
  toClass: (spacing) => `gap-${spacingScale[spacing]}`,
};

const paddingFamily: ClassFamily<Spacing> = {
  values: spacings,
  toClass: (spacing) => `p-${spacingScale[spacing]}`,
};

const paddingXFamily: ClassFamily<Spacing> = {
  values: spacings,
  toClass: (spacing) => `px-${spacingScale[spacing]}`,
};

const paddingYFamily: ClassFamily<Spacing> = {
  values: spacings,
  toClass: (spacing) => `py-${spacingScale[spacing]}`,
};

const alignFamily: ClassFamily<Align> = {
  values: alignments,
  toClass: (align) => `items-${align}`,
};

const justifyFamily: ClassFamily<Justify> = {
  values: justifications,
  toClass: (justify) => `justify-${justify}`,
};

const columnsFamily: ClassFamily<Columns> = {
  values: columnCounts,
  toClass: (columns) => `grid-cols-${columns}`,
};

/**
 * Classes d'une prop responsive. `basePrefix` remplace le préfixe vide de la
 * valeur de base : elle ne s'applique alors qu'à partir de ce point de rupture.
 */
const responsiveClasses = <T extends string | number>(
  family: ClassFamily<T>,
  value: Responsive<T> | undefined,
  basePrefix = ''
): ReadonlyArray<string> =>
  toResponsiveEntries(value).map(
    ({ prefix, value }) => `${prefix || basePrefix}${family.toClass(value)}`
  );

const allFamilyClasses = <T extends string | number>(
  family: ClassFamily<T>
): ReadonlyArray<string> =>
  ['', ...breakpoints.map((breakpoint) => `${breakpoint}:`)].flatMap((prefix) =>
    family.values.map((value) => `${prefix}${family.toClass(value)}`)
  );

/** Passage en ligne d'un `Inline` replié en colonne sous un point de rupture. */
const rowFromClass = (breakpoint: Breakpoint): string =>
  `${breakpoint}:flex-row`;

const joinClasses = (classes: ReadonlyArray<string | false>): string =>
  classes.filter(Boolean).join(' ');

export type StackLayout = Readonly<{
  gap?: Responsive<Spacing>;
  align?: Responsive<Align>;
}>;

export const stackClasses = ({ gap = 'md', align }: StackLayout): string =>
  joinClasses([
    'flex flex-col',
    ...responsiveClasses(gapFamily, gap),
    ...responsiveClasses(alignFamily, align),
  ]);

export type InlineLayout = Readonly<{
  gap?: Responsive<Spacing>;
  align?: Responsive<Align>;
  justify?: Responsive<Justify>;
  wrap?: boolean;
  /**
   * Empile les éléments en colonne sous ce point de rupture. Replié, les
   * éléments occupent toute la largeur : `align` et `justify` ne s'appliquent
   * qu'à partir de ce point de rupture.
   */
  collapseBelow?: Breakpoint;
}>;

export const inlineClasses = ({
  gap = 'sm',
  align,
  justify,
  wrap = true,
  collapseBelow,
}: InlineLayout): string => {
  const rowPrefix = collapseBelow === undefined ? '' : `${collapseBelow}:`;
  return joinClasses([
    'flex',
    collapseBelow === undefined
      ? 'flex-row'
      : `flex-col ${rowFromClass(collapseBelow)}`,
    wrap && 'flex-wrap',
    ...responsiveClasses(gapFamily, gap),
    ...responsiveClasses(alignFamily, align, rowPrefix),
    ...responsiveClasses(justifyFamily, justify, rowPrefix),
  ]);
};

export type GridLayout = Readonly<{
  columns: Responsive<Columns>;
  gap?: Responsive<Spacing>;
}>;

export const gridClasses = ({ columns, gap = 'md' }: GridLayout): string =>
  joinClasses([
    'grid',
    ...responsiveClasses(columnsFamily, columns),
    ...responsiveClasses(gapFamily, gap),
  ]);

export type BoxLayout = Readonly<{
  padding?: Responsive<Spacing>;
  paddingX?: Responsive<Spacing>;
  paddingY?: Responsive<Spacing>;
}>;

export const boxClasses = ({
  padding,
  paddingX,
  paddingY,
}: BoxLayout): string =>
  joinClasses([
    ...responsiveClasses(paddingFamily, padding),
    ...responsiveClasses(paddingXFamily, paddingX),
    ...responsiveClasses(paddingYFamily, paddingY),
  ]);

/** Toutes les classes dynamiques que les primitives peuvent produire. */
export const listLayoutClasses = (): ReadonlyArray<string> => [
  ...allFamilyClasses(gapFamily),
  ...allFamilyClasses(paddingFamily),
  ...allFamilyClasses(paddingXFamily),
  ...allFamilyClasses(paddingYFamily),
  ...allFamilyClasses(alignFamily),
  ...allFamilyClasses(justifyFamily),
  ...allFamilyClasses(columnsFamily),
  ...breakpoints.map(rowFromClass),
];
