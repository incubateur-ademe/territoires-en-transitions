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
        `text-primary-10 text-xs font-normal leading-6 flex-row${style}`
      )}
      {...props}
    >
      <Text style={tw('mx-2')}>•</Text>
      <Text>{children}</Text>
    </View>
  );
};
