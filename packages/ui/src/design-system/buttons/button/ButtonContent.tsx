import classNames from 'classnames';

import {Icon} from '../../icons/Icon';
import {buttonThemeClassnames} from '../utils';
import {IconSize} from '../../icons/types';
import {ButtonContentProps, ButtonSize} from '../types';

const getIconSize = (
  size: ButtonSize,
  isIconButton: boolean,
  isRemixIcon: boolean
): IconSize => {
  // Les icônes remix ont la taille définie par le font size
  // Dans le cas des icon buttons, une taille est définie pour forcer la largeur
  // et avoir un bouton carré
  if (isIconButton) {
    switch (size) {
      case 'xs':
        return 'md';
      case 'sm':
        return 'lg';
      case 'md':
        return 'xl';
      case 'xl':
        return '2xl';
    }
  } else if (!isRemixIcon) {
    return size;
  } else return undefined;
};

const ButtonContent = ({
  variant,
  size,
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
        'gap-1': size === 'xs' || size === 'sm',
        'gap-2': size === 'md' || size === 'xl',
      })}
    >
      {!!icon && iconPosition === 'left' && (
        <Icon
          icon={icon}
          size={getIconSize(size, isIconButton, typeof icon === 'string')}
          svgClassName={buttonThemeClassnames[variant][buttonState].icon}
        />
      )}

      {!!children && <div>{children}</div>}

      {!!icon && iconPosition === 'right' && (
        <Icon
          icon={icon}
          size={getIconSize(size, isIconButton, typeof icon === 'string')}
          svgClassName={buttonThemeClassnames[variant][buttonState].icon}
        />
      )}
    </div>
  );
};

export default ButtonContent;
