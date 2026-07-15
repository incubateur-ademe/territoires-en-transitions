import { Badge } from '@tet/ui';
import { RiDeleteBin6Line } from '@remixicon/react';

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
        size="xs"
        variant="grey"
        type="outlined"
        icon={<RiDeleteBin6Line />}
        iconPosition="left"
        title="Supprimer tous les filtres"
        trim={false}
      />
    </button>
  );
};
