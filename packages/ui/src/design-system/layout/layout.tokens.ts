export const spacingScale = {
  none: '0',
  xs: '1',
  sm: '2',
  md: '4',
  lg: '6',
  xl: '8',
} as const;

export type Spacing = keyof typeof spacingScale;

export const spacings = Object.keys(spacingScale) as ReadonlyArray<Spacing>;

export const breakpoints = ['sm', 'md', 'lg', 'xl'] as const;

export type Breakpoint = (typeof breakpoints)[number];

export type Responsive<T> =
  | T
  | Readonly<{ base?: T } & Partial<Record<Breakpoint, T>>>;

type ResponsiveEntry<T> = Readonly<{ prefix: string; value: T }>;

const isPerBreakpoint = <T extends string | number>(
  value: Responsive<T>
): value is Readonly<{ base?: T } & Partial<Record<Breakpoint, T>>> =>
  typeof value === 'object' && value !== null;

export const toResponsiveEntries = <T extends string | number>(
  value: Responsive<T> | undefined
): ReadonlyArray<ResponsiveEntry<T>> => {
  if (value === undefined) {
    return [];
  }
  if (!isPerBreakpoint(value)) {
    return [{ prefix: '', value }];
  }
  return [
    ...(value.base === undefined ? [] : [{ prefix: '', value: value.base }]),
    ...breakpoints.flatMap((breakpoint) => {
      const breakpointValue = value[breakpoint];
      return breakpointValue === undefined
        ? []
        : [{ prefix: `${breakpoint}:`, value: breakpointValue }];
    }),
  ];
};
