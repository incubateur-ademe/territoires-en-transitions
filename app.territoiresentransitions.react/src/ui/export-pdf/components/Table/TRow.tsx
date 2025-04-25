import { tw } from '@/app/ui/export-pdf/utils';
import { View, ViewProps } from '@react-pdf/renderer';

type TRowProps = ViewProps & {
  children: React.ReactNode | React.ReactNode[];
  index?: number;
  className?: string;
};

export const TRow = ({ children, index, className, ...props }: TRowProps) => {
  const style = className ? ` ${className}` : '';

  const background = index && index % 2 !== 0 ? 'bg-primary-0' : 'bg-white';

  return (
    <View
      style={tw(
        `${background} flex flex-row border-b-[0.5px] border-primary-4${style}`
      )}
      {...props}
    >
      {children}
    </View>
  );
};
