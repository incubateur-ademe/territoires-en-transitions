import {MouseEventHandler} from 'react';
import {Button, ButtonSize, ButtonVariant} from '@tet/ui';

export type TDisableAllFiltersProps = {
  onClick: MouseEventHandler;
  hidden?: boolean;
  disabled?: boolean;
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
};

/**
 * Affiche le bouton "Désactiver tous les filtres" des menus de filtres
 */
export const DisableAllFilters = ({
  onClick,
  hidden = false,
  disabled = false,
  label = 'Désactiver tous les filtres',
  variant = 'underlined',
  size = 'md',
  className,
}: TDisableAllFiltersProps) => {
  if (hidden) return null;

  return (
    <Button
      data-test="desactiver-les-filtres"
      disabled={disabled}
      variant={variant}
      icon="close-circle-fill"
      size={size}
      className={className}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};
