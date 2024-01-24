import classNames from 'classnames';
import {HTMLAttributes} from 'react';

type CardProps = {
  /** En-tête, sous forme d'une chaîne de caractères ou d'un noeud React */
  header?: string | React.ReactNode;
  /** Footer, sous forme d'une chaîne de caractères ou d'un noeud React */
  footer?: string | React.ReactNode;
  /** Initialise l'état de sélection de la carte */
  isSelected?: boolean;
};

/** Affiche une carte avec header et/ou footer
 * Pour appliquer des classnames au header ou au footer en fonction
 * des actions sur la carte, utiliser le préfixe `group-*:`
 */
export const Card = ({
  children,
  header,
  footer,
  isSelected,
  className,
  onClick,
  ...otherProps
}: CardProps & HTMLAttributes<HTMLDivElement>) => {
  const hasHoverEffect = isSelected !== undefined || !!onClick;

  return (
    <div
      {...otherProps}
      className={classNames(
        'p-7 m-px bg-white border border-primary-3 rounded-lg flex flex-col gap-4 text-primary-9 text-base font-bold group',
        {
          'hover:m-0 hover:cursor-pointer hover:shadow-md': hasHoverEffect,
          'hover:border-2 hover:border-primary-4':
            hasHoverEffect && !isSelected,
          '!m-0 border-2 border-info-1': isSelected,
        },
        className
      )}
      onClick={onClick}
    >
      {!!header && (
        <div className="text-primary-8 text-sm font-bold">{header}</div>
      )}

      {children}

      {!!footer && (
        <div className="text-primary-8 text-sm font-bold mt-auto">{footer}</div>
      )}
    </div>
  );
};
