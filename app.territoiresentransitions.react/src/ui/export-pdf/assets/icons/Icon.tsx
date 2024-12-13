import { tw } from '@/app/ui/export-pdf/utils';
import { preset } from '@/ui';
import { Path, SVGProps, Svg } from '@react-pdf/renderer';

const { colors } = preset.theme.extend;

export type IconProps = SVGProps & {
  path: string;
  className?: string;
};

export const Icon = ({
  fill,
  viewBox,
  path,
  className,
  ...props
}: IconProps) => {
  const customStyle = className ? ` ${className}` : '';

  return (
    <Svg
      viewBox={viewBox ?? '0 0 24 24'}
      fill={fill ?? colors.primary[10]}
      style={tw(`h-[8px] w-[8px]${customStyle}`)}
      {...props}
    >
      <Path d={path} />
    </Svg>
  );
};
