import { View, ViewProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type GapValue =
  | 0
  | 'px'
  | 0.5
  | 1
  | 1.5
  | 2
  | 2.5
  | 3
  | 3.5
  | 4
  | 5
  | 6
  | 7
  | 8;

export type StackProps = ViewProps & {
  children: React.ReactNode | React.ReactNode[];
  gap?: GapValue;
  direction?: 'col' | 'row';
  className?: string;
};

export const Stack = ({
  children,
  gap = 3,
  direction = 'col',
  className,
  ...props
}: StackProps) => {
  const style = className ? ` ${className}` : '';

  return (
    <View style={tw(`flex flex-${direction} gap-${gap}${style}`)} {...props}>
      {children}
    </View>
  );
};
