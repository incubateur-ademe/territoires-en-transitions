import classNames from 'classnames';

type DividerProps = {
  /** Permet d'ajuster le style */
  className?: string;
  // todo? ajout d'une orientation et d'un variant
};

/**
 * Renvoie un <hr /> stylisé avec le thème du design system
 */

export const Divider = ({className}: DividerProps) => {
  return (
    <hr
      className={classNames(
        'bg-gradient-to-r from-primary-3 to-primary-3',
        className
      )}
    />
  );
};
