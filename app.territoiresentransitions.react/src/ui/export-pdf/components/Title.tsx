import { Text, TextProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type VariantType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const variantToClassname: Record<VariantType, string> = {
  h1: 'text-2xl',
  h2: 'text-xl',
  h3: 'text-lg',
  h4: 'text-base',
  h5: 'text-xs',
  h6: 'text-[0.7rem]',
};

type TitleProps = TextProps & {
  children: React.ReactNode;
  variant: VariantType;
  className?: string;
};

export const Title = ({
  children,
  variant,
  className,
  ...props
}: TitleProps) => {
  const style = className ? ` ${className}` : '';

  return (
    <Text
      style={tw(
        `text-primary-9 font-bold ${variantToClassname[variant]} leading-6${style}`
      )}
      {...props}
    >
      {children}
    </Text>
  );
};
