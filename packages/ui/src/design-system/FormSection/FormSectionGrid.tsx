import { cn } from '@/ui/utils/cn';

export type FormSectionGridProps = {
  /** Id appliqué au container du formulaire */
  formSectionId?: string;
  /** Enfants à afficher dans la grille (généralement des Field) */
  children: React.ReactNode;
  /** Permet d'ajuster les styles de la grille d'enfant */
  className?: string;
};

/**
 * Affiche une grille de champs de formulaire
 */
export const FormSectionGrid = ({
  formSectionId,
  children,
  className,
}: FormSectionGridProps) => (
  <div
    id={formSectionId}
    className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}
  >
    {children}
  </div>
);
