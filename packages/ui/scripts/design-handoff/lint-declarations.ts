import type { Declaration } from './declarations.ts';

export type RuleId = 'R1' | 'R2' | 'R3' | 'R4';

export type Finding = Readonly<{ rule: RuleId; message: string }>;

export const SPACING_SCALE_PX: ReadonlyArray<number> = [0, 4, 8, 16, 24, 32];

const ROOT_FONT_SIZE_PX = 16;
const MARGIN = /^margin(-|$)/;
const PADDING_OR_GAP = /^(padding(-|$)|(row-|column-)?gap$)/;
const COLOR_PROPERTY =
  /^(color|background(-color)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|text-decoration-color|caret-color)$/;
const LITERAL_COLOR =
  /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|hwb)\(/i;
const RADIUS_OR_SHADOW = /^(border(-[a-z]+)*-radius|box-shadow)$/;
const HAND_WRITTEN_TYPOGRAPHY =
  /^(font-size|font-weight|line-height|letter-spacing|font)$/;
const EMPTY_VALUES = ['0', 'none', 'inherit', 'initial', 'unset'];

const toPixels = (token: string): number | undefined => {
  const match = /^(-?\d*\.?\d+)(px|rem|em)$/.exec(token);
  if (match) {
    const [, amount = '', unit] = match;
    return Number(amount) * (unit === 'px' ? 1 : ROOT_FONT_SIZE_PX);
  }
  return token === '0' ? 0 : undefined;
};

const nearestSteps = (pixels: number): ReadonlyArray<number> => {
  const below = SPACING_SCALE_PX.filter((step) => step <= pixels).at(-1);
  const above = SPACING_SCALE_PX.find((step) => step >= pixels);
  return [below, above].filter((step): step is number => step !== undefined);
};

const offScaleFindings = ({
  property,
  value,
}: Declaration): ReadonlyArray<Finding> =>
  value.split(/\s+/).flatMap((token) => {
    const pixels = toPixels(token);
    if (pixels === undefined || SPACING_SCALE_PX.includes(pixels)) return [];
    const options = nearestSteps(pixels)
      .map((step) => `${step}px`)
      .join(' ou ');
    return [
      {
        rule: 'R3',
        message: `${property} : ${token} est hors de l'échelle 0, 4, 8, 16, 24, 32 px (le plus proche : ${options})`,
      },
    ];
  });

const hasNonZeroMargin = (value: string): boolean =>
  value.split(/\s+/).some((token) => token !== 'auto' && toPixels(token) !== 0);

const isTokenValue = (value: string): boolean => value.includes('var(');

const isEmptyValue = (value: string): boolean => EMPTY_VALUES.includes(value);

export const declaresSurface = ({ property, value }: Declaration): boolean =>
  RADIUS_OR_SHADOW.test(property) && !isEmptyValue(value);

export const lintDeclaration = ({
  property,
  value,
}: Declaration): ReadonlyArray<Finding> => {
  if (value.includes('{{')) return [];

  if (MARGIN.test(property)) {
    return hasNonZeroMargin(value)
      ? [
          {
            rule: 'R2',
            message: `${property} : une marge sur un enfant ; l'espacement vient du gap du parent`,
          },
        ]
      : [];
  }
  if (PADDING_OR_GAP.test(property)) {
    return offScaleFindings({ property, value });
  }
  if (COLOR_PROPERTY.test(property) && LITERAL_COLOR.test(value)) {
    return [
      {
        rule: 'R3',
        message: `${property} : une couleur en dur (${value}) ; utiliser un token du design system`,
      },
    ];
  }
  if (
    RADIUS_OR_SHADOW.test(property) &&
    !isEmptyValue(value) &&
    !isTokenValue(value)
  ) {
    return [
      {
        rule: 'R3',
        message: `${property} : ${value} n'est pas un token du design system`,
      },
    ];
  }
  if (HAND_WRITTEN_TYPOGRAPHY.test(property)) {
    return [
      {
        rule: 'R4',
        message: `${property} écrit à la main ; la taille vient de la balise (h1 à h6) ou d'une classe paragraphe-* ou text-*`,
      },
    ];
  }
  if (property === 'font-family' && !isTokenValue(value)) {
    return [
      {
        rule: 'R4',
        message:
          'font-family écrite à la main ; la police est celle du design system',
      },
    ];
  }
  return [];
};
