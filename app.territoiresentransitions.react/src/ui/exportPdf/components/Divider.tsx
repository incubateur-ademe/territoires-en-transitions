import { View, ViewProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type DividerProps = ViewProps & {
  className?: string;
};

export const Divider = ({ className, ...props }: DividerProps) => {
  const style = className ? ` ${className}` : '';

  return <View style={tw(`bg-primary-3 h-px${style}`)} {...props} />;
};
