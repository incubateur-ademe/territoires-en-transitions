import { Icon, IconValue } from '@/ui/design-system/Icon';
import classNames from 'classnames';
import { FormSectionGrid, FormSectionGridProps } from './FormSectionGrid';

type FormSectionProps = {
  /** Titre de la section */
  title: string;
  /** Icône de la section */
  icon?: IconValue;
  /** Description optionnelle de la section */
  description?: string;

  /* If true, reduce gap between header & childre */
  smallRootGap?: boolean;
} & FormSectionGridProps;

/** Affiche une section de formulaire */
export const FormSection = ({
  className,
  smallRootGap,
  title,
  description,
  icon,
  children,
}: FormSectionProps) => {
  return (
    <div
      className={classNames('flex flex-col', smallRootGap ? 'gap-4' : 'gap-6')}
    >
      {/** Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {icon && <Icon icon={icon} className="text-primary-7" />}
          <div className="font-bold text-primary-10 text-xl">{title}</div>
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
