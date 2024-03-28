import classNames from 'classnames';

type DividerProps = {
  /** Permet de modifier la couleur par défaut */
  color?: 'light' | 'medium';
  /** Permet d'ajuster le style */
  className?: string;
  // todo? ajout d'une orientation et d'un variant
};

/**
 * Renvoie un <hr /> stylisé avec le thème du design system
 */

export const Divider = ({color = 'light', className}: DividerProps) => {
  return (
    <hr
      className={classNames(
        'w-full bg-gradient-to-r',
        {
          'from-primary-3 to-primary-3': color === 'light',
          'from-primary-5 to-primary-5': color === 'medium',
        },
        className
      )}
    />
  );
};
