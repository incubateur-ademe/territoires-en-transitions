import { Text, TextProps } from '@react-pdf/renderer';
import {
  ColorVariant,
  SizeVariant,
  TypeVariant,
  variantClassNames,
} from '@tet/design-tokens';
import { Stack } from '../Stack';
import { tw } from '../utils';

type BadgeProps = TextProps & {
  title: React.ReactNode;
  variant?: ColorVariant;
  type?: TypeVariant;
  size?: SizeVariant;
  uppercase?: boolean;
  className?: string;
};

export const Badge = ({
  title,
  variant = 'default',
  type = 'solid',
  size = 'xs',
  uppercase = false,
  className,
  ...props
}: BadgeProps) => {
  const extra = className ? ` ${className}` : '';

  const { background, border, text } = variantClassNames[variant][type];

  let fontStyle = size === 'sm' ? 'text-xs' : 'text-[0.6rem]';

  const paddingStyle = size === 'sm' ? 'px-1.5' : 'px-1';

  if (uppercase) fontStyle += ' uppercase';

  return (
    <Stack
      direction="row"
      gap={0}
      className={`${paddingStyle} py-0.5 ${background} ${border} border-y border-x rounded items-center${extra}`}
    >
      <Text
        style={tw(`${text} ${fontStyle} leading-snug font-bold`)}
        {...props}
      >
        {title}
      </Text>
    </Stack>
  );
};
