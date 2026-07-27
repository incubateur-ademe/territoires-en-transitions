import { type ReactElement } from 'react';
import { cn } from '../../utils/cn';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Élément JSX Remixicon : `icon={<RiEditLine />}` */
export type IconValue = ReactElement<{ className?: string }>;

/** @deprecated Prefer `IconValue` */
export type IconComponent = IconValue;

type IconProps = {
  icon: IconValue;
  size?: IconSize;
  className?: string;
};

const SIZE_CLASSNAMES: Record<IconSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
  '2xl': 'h-8 w-8',
};

export const Icon = ({ icon, size = 'md', className }: IconProps) => {
  const IconSvg = icon.type;
  return (
    <IconSvg
      {...icon.props}
      // Empêche width/height=24 par défaut de Remixicon de gagner sur les classes
      size="1em"
      className={cn(
        // SVG inline ≠ glyphe font : sans ça, l'icône se cale sur la baseline
        // et gonfle / casse la ligne à côté du texte.
        'inline-block shrink-0 align-middle',
        SIZE_CLASSNAMES[size],
        icon.props.className,
        className
      )}
    />
  );
};

Icon.displayName = 'Icon';
