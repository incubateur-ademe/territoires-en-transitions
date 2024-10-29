import { Text, TextProps } from '@react-pdf/renderer';
import { tw } from '../../utils';
import { BadgeState, badgeClassnames } from '@tet/ui';
import { Stack } from '../Stack';

type BadgeProps = TextProps & {
  title: React.ReactNode;
  state?: BadgeState;
  size?: 'sm' | 'md';
  uppercase?: boolean;
  className?: string;
};

export const Badge = ({
  title,
  state = 'default',
  size = 'md',
  uppercase = false,
  className,
  ...props
}: BadgeProps) => {
  const style = className ? ` ${className}` : '';

  let { background, border, text } = badgeClassnames[state];

  let fontStyle =
    size === 'sm' ? 'text-[0.65rem] leading-5' : 'text-xs leading-5';
  if (uppercase) fontStyle += ' uppercase';

  return (
    <Stack direction="row" gap={0}>
      <Text
        style={tw(
          `${background} ${border} ${text} ${fontStyle} border rounded px-1.5 py-0.5 font-bold${style}`
        )}
        {...props}
      >
        {title}
      </Text>
    </Stack>
  );
};
