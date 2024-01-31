import {Icon, IconSize} from '@design-system/Icon';
import {buttonThemeClassnames} from './theme';
import {ButtonContentProps, ButtonSize} from './types';

const getIconSize = (size: ButtonSize): IconSize | undefined => {
  // Les sizes des icônes ne matchent pas celles des boutons
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
};

/** Affiche le contenu d'un bouton */
const ButtonContent = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  disabled,
}: ButtonContentProps) => {
  const buttonState = disabled ? 'disabled' : 'default';

  return (
    <>
      {!!icon && (
        <Icon
          icon={icon}
          size={getIconSize(size)}
          className={buttonThemeClassnames[variant][buttonState].icon}
        />
      )}

      {!!children && children}
    </>
  );
};

export default ButtonContent;
