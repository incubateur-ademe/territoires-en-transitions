import classNames from 'classnames';
import { Icon, IconSize } from '../Icon';
import { Notification } from '../Notification';
import { buttonThemeClassnames } from './theme';
import { ButtonContentProps, ButtonSize, ButtonVariant } from './types';

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
  loading,
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
      {(!!icon || loading) && (
        <Icon
          icon={loading || !icon ? 'loader-3-line' : icon}
          size={getIconSize(size, variant)}
          className={classNames(
            buttonThemeClassnames[variant][buttonState].icon,
            { 'animate-spin-slow': loading }
          )}
        />
      )}

      {!!children && children}
    </>
  );
};

export default ButtonContent;
