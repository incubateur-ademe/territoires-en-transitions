import { Icon, IconSize } from '@tet/ui/design-system/Icon';
import { buttonThemeClassnames } from './theme';
import { ButtonContentProps, ButtonSize, ButtonVariant } from './types';
import classNames from 'classnames';
import { Notification } from '../Notification';

const getIconSize = (
  size: ButtonSize,
  variant: ButtonVariant
): IconSize | undefined => {
  // Les sizes des icônes ne matchent pas celles des boutons
  switch (size) {
    case 'xs':
      return variant === 'underlined' ? 'xs' : 'sm';
    case 'sm':
      return variant === 'underlined' ? 'sm' : 'md';
    case 'md':
      return 'md';
    case 'xl':
      return 'lg';
  }
};

/** Affiche le contenu d'un bouton */
const ButtonContent = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  disabled,
  notification,
}: ButtonContentProps) => {
  const buttonState = disabled ? 'disabled' : 'default';

  return (
    <>
      {notification && (
        <Notification
          size="xs"
          {...notification}
          classname={classNames(
            'absolute -top-2.5 -right-2.5',
            notification.classname
          )}
        />
      )}
      {!!icon && (
        <Icon
          icon={icon}
          size={getIconSize(size, variant)}
          className={classNames(
            buttonThemeClassnames[variant][buttonState].icon,
            {
              'mb-1': variant === 'underlined' && size === 'sm',
              'mb-0.5':
                variant === 'underlined' && (size === 'xs' || size === 'md'),
            }
          )}
        />
      )}

      {!!children && children}
    </>
  );
};

export default ButtonContent;
