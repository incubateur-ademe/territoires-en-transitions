import classNames from 'classnames';

import {Icon, IconValue} from '@design-system/Icon';

type Props = {
  /** Titre de la section */
  title: string;
  /** Enfants à afficher dans la grille (généralement des Field) */
  children: React.ReactNode;
  /** Permet d'ajuster les styles de la grille d'enfant */
  className?: string;
  /** Icône de la section */
  icon?: IconValue;
  /** Description optionnelle de la section */
  description?: string;
};

/** Affiche une section de formulaire */
export const FormSection = ({
  className,
  title,
  description,
  icon,
  children,
}: Props) => {
  return (
    <div className="flex flex-col gap-6">
      {/** Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {icon && <Icon icon={icon} className="text-primary-7" />}
          <div className="font-bold text-primary-10">{title}</div>
        </div>
        {description && (
          <div className="text-sm text-primary-10">{description}</div>
        )}
        <div className="h-px bg-primary-3" />
      </div>
      {/** Grille de children */}
      <div className={classNames('grid grid-cols-2 gap-6', className)}>
        {children}
      </div>
    </div>
  );
};
