import { Text, TextProps } from '@react-pdf/renderer';
import { BadgeState, badgeClassnames } from '@tet/ui';
import { tw } from '../../utils';
import { Stack } from '../Stack';

type BadgeProps = TextProps & {
  title: React.ReactNode;
  state?: BadgeState;
  light?: boolean;
  size?: 'sm' | 'md';
  uppercase?: boolean;
  className?: string;
};

export const Badge = ({
  title,
  state = 'default',
  light = false,
  size = 'md',
  uppercase = false,
  className,
  ...props
}: BadgeProps) => {
  const style = className ? ` ${className}` : '';

  const { background, border, text } = badgeClassnames[state];

  const backgroundColor = light === true ? 'bg-white' : background;

  let fontStyle =
    size === 'sm' ? 'text-[0.5rem] leading-5' : 'text-[0.6rem] leading-5';

  if (uppercase) fontStyle += ' uppercase';

  return (
    <Stack wrap={false} direction="row" gap={0}>
      <Text
        style={tw(
          `${backgroundColor} ${border} ${text} ${fontStyle} border rounded px-1.5 py-0.5 font-bold${style}`
        )}
        {...props}
      >
        {title}
      </Text>
    </Stack>
  );
};
