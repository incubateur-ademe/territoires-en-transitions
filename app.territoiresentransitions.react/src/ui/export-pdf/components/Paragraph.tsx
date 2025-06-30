import { Text, TextProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type ParagraphProps = TextProps & {
  children: React.ReactNode;
  className?: string;
};

export const Paragraph = ({
  children,
  className,
  ...props
}: ParagraphProps) => {
  const style = className ? ` ${className}` : '';

  return (
    <Text
      style={tw(`text-primary-10 text-[0.65rem] font-normal leading-6${style}`)}
      {...props}
    >
      {children}
    </Text>
  );
};
