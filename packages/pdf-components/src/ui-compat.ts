import { designTokens } from '@tet/design-tokens';

export { badgeClassnames, type BadgeVariant, type BadgeType, type BadgeSize } from '@tet/design-tokens';

export const preset = {
  theme: {
    extend: {
      fontFamily: designTokens.fontFamily,
      colors: designTokens.colors,
      fontSize: designTokens.fontSize,
      fontWeight: designTokens.fontWeight,
    },
  },
} as const;

type OptionValue = number | string;

type Option = {
  value: OptionValue;
  label: string;
};

export const getOptionLabel = (
  optionValue: OptionValue,
  options: Option[]
): string | undefined =>
  options.find((v) => v.value?.toString() === optionValue.toString())?.label;
