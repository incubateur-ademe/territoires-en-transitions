import classNames from 'classnames';

export type FormSectionGridProps = {
  /** Enfants à afficher dans la grille (généralement des Field) */
  children: React.ReactNode;
  /** Permet d'ajuster les styles de la grille d'enfant */
  className?: string;
};

/**
 * Affiche une grille de champs de formulaire
 */
export const FormSectionGrid = ({
  children,
  className,
}: FormSectionGridProps) => (
  <div
    className={classNames('grid grid-cols-1 md:grid-cols-2 gap-6', className)}
  >
    {children}
  </div>
);
