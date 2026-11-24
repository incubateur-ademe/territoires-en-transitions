export type Declaration = Readonly<{ property: string; value: string }>;

type SplitState = Readonly<{
  parts: ReadonlyArray<string>;
  current: string;
  depth: number;
}>;

const splitStep = (state: SplitState, char: string): SplitState => {
  if (char === '(') {
    return { ...state, current: state.current + char, depth: state.depth + 1 };
  }
  if (char === ')') {
    return {
      ...state,
      current: state.current + char,
      depth: Math.max(0, state.depth - 1),
    };
  }
  if (char === ';' && state.depth === 0) {
    return { parts: [...state.parts, state.current], current: '', depth: 0 };
  }
  return { ...state, current: state.current + char };
};

const toDeclaration = (part: string): ReadonlyArray<Declaration> => {
  const separator = part.indexOf(':');
  if (separator < 1) return [];
  const property = part.slice(0, separator).trim().toLowerCase();
  const value = part.slice(separator + 1).trim();
  return property && value ? [{ property, value }] : [];
};

export const parseDeclarations = (css: string): ReadonlyArray<Declaration> => {
  const { parts, current } = [...css].reduce<SplitState>(splitStep, {
    parts: [],
    current: '',
    depth: 0,
  });
  return [...parts, current].flatMap(toDeclaration);
};

export type StyleRule = Readonly<{
  selector: string;
  declarations: ReadonlyArray<Declaration>;
}>;

export const parseStyleRules = (css: string): ReadonlyArray<StyleRule> =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: (selector ?? '').trim(),
    declarations: parseDeclarations(body ?? ''),
  }));
