import { Text, View, ViewProps } from '@react-pdf/renderer';
import { tw } from '../../utils';

const variantToFont: Record<'head' | 'title' | 'data', string> = {
  head: 'text-grey-9 font-normal text-[0.6rem] uppercase',
  title: 'text-primary-9 font-bold text-xs',
  data: 'text-primary-7 font-bold text-xs',
};

type TCellProps = ViewProps & {
  children: React.ReactNode;
  colsNumber: number;
  variant?: 'head' | 'title' | 'data';
  className?: string;
  contentClassName?: string;
};

export const TCell = ({
  children,
  colsNumber,
  variant = 'data',
  className,
  contentClassName,
  ...props
}: TCellProps) => {
  const style = className ? ` ${className}` : '';
  const contentStyle = contentClassName ? ` ${contentClassName}` : '';

  const width = `w-[${100 / colsNumber}%]`;

  const font = `${variantToFont[variant]}`;

  return (
    <View
      style={tw(
        `p-1 border-r-[0.5px] border-primary-4 flex justify-center items-center ${width}${style}`
      )}
      {...props}
    >
      <Text style={tw(`${font} text-center leading-6${contentStyle}`)}>
        {children}
      </Text>
    </View>
  );
};
