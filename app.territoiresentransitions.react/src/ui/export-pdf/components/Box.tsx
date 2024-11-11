import { View, ViewProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type BoxProps = ViewProps & {
  children?: React.ReactNode;
  className?: string;
};

export const Box = ({ children, className, ...props }: BoxProps) => {
  return (
    <View style={className ? tw(className) : {}} {...props}>
      {children}
    </View>
  );
};
