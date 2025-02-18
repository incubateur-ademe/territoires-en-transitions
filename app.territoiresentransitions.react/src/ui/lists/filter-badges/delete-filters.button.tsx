import { Badge } from '@/ui';

/** Bouton badge générique pour supprimer des filtres */
export const DeleteFiltersButton = ({
  onClick,
  className,
  dataTest = 'desactiver-les-filtres',
}: {
  onClick: () => void;
  className?: string;
  dataTest?: string;
}) => {
  return (
    <button data-test={dataTest} onClick={onClick} className={className}>
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
