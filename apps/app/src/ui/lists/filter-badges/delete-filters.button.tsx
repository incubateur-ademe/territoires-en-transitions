import { Badge } from '@/ui';

/** Bouton badge générique pour supprimer des filtres */
export const DeleteFiltersButton = ({
  onClick,
  className,
  disabled,
  dataTest = 'desactiver-les-filtres',
}: {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  dataTest?: string;
}) => {
  return (
    <button
      data-test={dataTest}
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      <Badge
        state="default"
        size="sm"
        icon="delete-bin-6-line"
        iconPosition="left"
        title="Supprimer tous les filtres"
        trim={false}
      />
    </button>
  );
};
