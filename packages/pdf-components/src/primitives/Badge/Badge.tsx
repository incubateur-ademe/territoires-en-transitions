import { Text, TextProps } from '@react-pdf/renderer';
import {
  BadgeSize,
  BadgeType,
  BadgeVariant,
  badgeClassnames,
} from '../../ui-compat';
import { Stack } from '../Stack';
import { tw } from '../utils';

type BadgeProps = TextProps & {
  title: React.ReactNode;
  variant?: BadgeVariant;
  type?: BadgeType;
  size?: BadgeSize;
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

  const { background, border, text } = badgeClassnames[variant][type];

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
