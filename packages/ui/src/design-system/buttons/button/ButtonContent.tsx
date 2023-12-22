import {ButtonProps, ButtonSize, isAnchorButton} from '../types';
import {Icon} from '../../icons/Icon';
import {buttonThemeClassnames} from '../utils';
import classNames from 'classnames';
import {IconSize} from '../../icons/types';

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

const ButtonContent = (props: ButtonProps) => {
  const {variant, size, icon, iconPosition = 'left', children} = props;
  const isIconButton = !children;

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
          svgClassName={buttonThemeClassnames[variant].icon}
        />
      )}

      {!!children && (
        <div
          className={classNames('flex items-center', {
            'gap-1': size === 'xs' || size === 'sm',
            'gap-2': size === 'md' || size === 'xl',
          })}
        >
          <div>{children}</div>
          {isAnchorButton(props) && props.external && (
            <Icon icon="external-link-line" />
          )}
        </div>
      )}

      {!!icon && iconPosition === 'right' && (
        <Icon
          icon={icon}
          size={getIconSize(size, isIconButton, typeof icon === 'string')}
          svgClassName={buttonThemeClassnames[variant].icon}
        />
      )}
    </div>
  );
};

export default ButtonContent;
