import { tw } from '@/app/ui/export-pdf/utils';
import { View, ViewProps } from '@react-pdf/renderer';

type TableProps = ViewProps & {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
};

export const Table = ({ children, className, ...props }: TableProps) => {
  const style = className ? ` ${className}` : '';

  return (
    <View
      style={tw(`border-t-[0.5px] border-l-[0.5px] border-primary-4${style}`)}
      {...props}
    >
      {children}
    </View>
  );
};
