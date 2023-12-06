import {ButtonProps, ButtonSize, isAnchorButton} from '../types';
import {Icon} from '../../icons/Icon';
import {buttonThemeClassnames} from '../utils';
import classNames from 'classnames';
import {IconSize} from '../../icons/types';

const getIconSize = (size: ButtonSize, isIconButton: boolean): IconSize => {
  switch (size) {
    case 'xs':
      return isIconButton ? 'md' : 'xs';
    case 'sm':
      return isIconButton ? 'lg' : 'sm';
    case 'md':
      return isIconButton ? 'xl' : 'md';
    case 'xl':
      return isIconButton ? '2xl' : 'xl';
  }
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
          size={getIconSize(size, isIconButton)}
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
            <Icon icon="fr-icon-external-link-line" size={size} />
          )}
        </div>
      )}

      {!!icon && iconPosition === 'right' && (
        <Icon
          icon={icon}
          size={getIconSize(size, isIconButton)}
          svgClassName={buttonThemeClassnames[variant].icon}
        />
      )}
    </div>
  );
};

export default ButtonContent;
