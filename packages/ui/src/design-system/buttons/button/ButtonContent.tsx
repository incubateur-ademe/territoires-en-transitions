import classNames from 'classnames';

import {Icon, IconSize} from '@design-system/icons/Icon';
import {buttonThemeClassnames} from '../theme';
import {ButtonContentProps, ButtonSize} from '../types';

const getIconSize = (
  size: ButtonSize,
  isIconButton: boolean
): IconSize | undefined => {
  // Les sizes des icônes ne matchent pas celles des boutons
  // et sont différentes en fonction du type de bouton (texte ou icône)
  if (isIconButton) {
    switch (size) {
      case 'xs':
        return 'sm';
      case 'sm':
        return 'sm';
      case 'md':
        return 'md';
      case 'xl':
        return 'lg';
    }
  } else {
    switch (size) {
      case 'xs':
        return 'sm';
      case 'sm':
        return 'md';
      case 'md':
        return 'md';
      case 'xl':
        return 'lg';
    }
  }
};

/** Affiche le contenu d'un bouton */
const ButtonContent = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  disabled,
}: ButtonContentProps) => {
  const isIconButton = !children;

  const buttonState = disabled ? 'disabled' : 'default';

  return (
    <div
      className={classNames('flex items-center', {
        'gap-1': size === 'xs',
        'gap-2': size === 'sm' || size === 'md' || size === 'xl',
        'flex-row-reverse': iconPosition === 'right',
      })}
    >
      {!!icon && (
        <Icon
          icon={icon}
          size={getIconSize(size, isIconButton)}
          className={buttonThemeClassnames[variant][buttonState].icon}
        />
      )}

      {!!children && <div>{children}</div>}
    </div>
  );
};

export default ButtonContent;
