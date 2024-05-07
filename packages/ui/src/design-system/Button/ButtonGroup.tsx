import {CSSProperties} from 'react';
import classNames from 'classnames';

import {DefaultButtonProps, ButtonSize} from './types';
import {Button} from './Button';

type Props = {
  /** Listes de boutons à afficher avec leurs propriétés */
  buttons: DefaultButtonProps[];
  /** Permet d'ajuster les styles du container */
  className?: string;
  /** Taille des boutons */
  size?: ButtonSize;
  /** Id du bouton affiché dans une variante primary */
  activeButtonId?: string;
};

/**
 *  Affiche un groupe d'onglets.
 */
export const ButtonGroup = ({
  className,
  size = 'md',
  buttons,
  activeButtonId,
}: Props) => {
  /** Applique les bons styles pour les borders et border-radius
   * en fonction de la position du bouton dans le tableau */
  const getButtonStyles = (index: number): CSSProperties => {
    if (index === 0) {
      return {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      };
    } else if (buttons.length === 2) {
      return {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderLeft: 0,
      };
    } else {
      if (index > 0 && index < buttons.length - 1)
        return {
          borderRadius: 0,
          borderRight: 0,
          borderLeft: 0,
        };
      if (index === buttons.length - 1)
        return {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        };
    }
  };

  return (
    <div className={classNames('flex items-center', className)}>
      {buttons.map((props, index) => (
        <Button
          key={index}
          {...props}
          size={size}
          variant={activeButtonId === props.id ? 'primary' : 'outlined'}
          className="!border-primary-7"
          style={getButtonStyles(index)}
        />
      ))}
    </div>
  );
};
