import { Text, View, ViewProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type ListElementProps = ViewProps & {
  children?: React.ReactNode;
  className?: string;
};

export const ListElement = ({
  children,
  className,
  ...props
}: ListElementProps) => {
  const style = className ? ` ${className}` : '';

  return (
    <View
      style={tw(
        `text-primary-10 text-[0.65rem] font-normal leading-6 flex-row${style}`
      )}
      {...props}
    >
      <Text style={tw('ml-1 mr-2')}>•</Text>
      <Text style={tw('w-[98%]')}>{children}</Text>
    </View>
  );
};
