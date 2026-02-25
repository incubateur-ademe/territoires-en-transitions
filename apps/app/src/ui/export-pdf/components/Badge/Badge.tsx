import { Text, TextProps } from '@react-pdf/renderer';
import { BadgeSize, BadgeType, BadgeVariant, badgeClassnames } from '@tet/ui';
import { tw } from '../../utils';
import { Stack } from '../Stack';

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
  size = 'sm',
  uppercase = false,
  className,
  ...props
}: BadgeProps) => {
  const style = className ? ` ${className}` : '';

  const { background, border, text } = badgeClassnames[variant][type];

  let fontStyle = size === 'sm' ? 'text-sm' : 'text-xs';

  const paddingStyle = size === 'sm' ? 'px-3 py-1' : 'px-1.5 py-0.5';

  if (uppercase) fontStyle += ' uppercase';

  return (
    <Stack wrap={false} direction="row" gap={0}>
      <Text
        style={tw(
          `${paddingStyle} ${background} ${border} ${text} ${fontStyle} leading-4 border rounded font-bold ${style}`
        )}
        {...props}
      >
        {title}
      </Text>
    </Stack>
  );
};
