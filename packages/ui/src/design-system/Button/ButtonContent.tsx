import classNames from 'classnames';
import { Icon, IconSize } from '../Icon';
import { Notification } from '../Notification';
import { buttonThemeClassnames } from './theme';
import { ButtonContentProps, ButtonSize, ButtonVariant } from './types';

const getIconSize = (
  size: ButtonSize,
  variant: ButtonVariant
): IconSize | undefined => {
  // Les sizes des icônes ne matchent pas celles des boutons : les variantes
  // sans cadre portent une icône d'un cran plus petite, à la mesure du texte.
  const isTextVariant = variant === 'underlined' || variant === 'link';
  switch (size) {
    case 'xs':
      return isTextVariant ? 'xs' : 'sm';
    case 'sm':
      return isTextVariant ? 'sm' : 'md';
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
