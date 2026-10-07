import { CSSProperties } from 'react';

import { cn } from '../../utils/cn';
import { Button } from './Button';
import { buttonGroupTheme } from './theme';
import { ButtonSize, DefaultButtonProps } from './types';

type Props = {
  /** Listes de boutons à afficher avec leurs propriétés */
  buttons: Omit<DefaultButtonProps, 'variant' | 'aria-pressed'>[];
  /** Permet d'ajuster les styles du container */
  className?: string;
  /** Rempli la place disponible, `false` par défaut */
  fillContainer?: boolean;
  /** Taille des boutons */
  size?: ButtonSize;
  /** On ne traite que deux variantes, la primaire et une neutre */
  variant?: 'primary' | 'neutral';
  /** Id du bouton affiché dans une variante primary */
  activeButtonId?: string | null;
  label?: string;
};

/**
 *  Affiche un groupe d'onglets.
 */
export const ButtonGroup = ({
  className,
  size = 'md',
  buttons,
  variant = 'primary',
  activeButtonId,
  fillContainer = false,
  label,
}: Props) => {
  const hasGroupLabel = Boolean(label);

  /** Applique les bons styles pour les borders et border-radius
   * en fonction de la position du bouton dans le tableau */
  const getButtonBorder = (index: number): CSSProperties => {
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

    return {};
  };

  return (
    <div
      role={hasGroupLabel ? 'group' : undefined}
      aria-label={label}
      className={cn('grow flex items-center', className)}
    >
      {buttons.map((props, index) => {
        const isActive = props.id === activeButtonId;
        const state = isActive ? 'active' : 'default';

        const { text, background, border, icon } =
          buttonGroupTheme[variant][state][
            props.disabled ? 'disabled' : 'normal'
          ];

        return (
          <Button
            key={index}
            {...props}
            aria-pressed={isActive}
            size={size}
            variant="outlined"
            className={cn(text, background, border, icon, {
              'justify-center flex-1 h-full': fillContainer,
            })}
            style={getButtonBorder(index)}
          />
        );
      })}
    </div>
  );
};
