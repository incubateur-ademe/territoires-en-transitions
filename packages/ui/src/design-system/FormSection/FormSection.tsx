import { Icon, IconValue } from '@tet/ui/design-system/Icon';
import { FormSectionGrid, FormSectionGridProps } from './FormSectionGrid';

type FormSectionProps = {
  /** Titre de la section */
  title: string;
  /** Icône de la section */
  icon?: IconValue;
  /** Description optionnelle de la section */
  description?: string;
} & FormSectionGridProps;

/** Affiche une section de formulaire */
export const FormSection = ({
  className,
  title,
  description,
  icon,
  children,
}: FormSectionProps) => {
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
      <FormSectionGrid children={children} className={className} />
    </div>
  );
};
