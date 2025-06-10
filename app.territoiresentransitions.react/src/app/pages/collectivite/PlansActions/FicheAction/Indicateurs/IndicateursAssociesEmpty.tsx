import { EmptyCard } from '@/ui';
import DatavizPicto from './DatavizPicto';

type IndicateursAssociesEmptyProps = {
  isReadonly: boolean;
  onCreateIndicateur: () => void;
  onAssociateIndicateur: () => void;
};

export const IndicateursAssociesEmpty = ({
  isReadonly,
  onCreateIndicateur,
  onAssociateIndicateur,
}: IndicateursAssociesEmptyProps) => {
  return (
    <EmptyCard
      picto={(props) => <DatavizPicto {...props} />}
      title="Aucun indicateur associé !"
      subTitle="Observez votre progression grâce aux indicateurs"
      isReadonly={isReadonly}
      actions={[
        {
          children: 'Créer un indicateur',
          icon: 'add-line',
          onClick: onCreateIndicateur,
          variant: 'outlined',
        },
        {
          children: 'Associer des indicateurs',
          icon: 'link',
          onClick: onAssociateIndicateur,
          variant: 'primary',
        },
      ]}
      size="xs"
    />
  );
};
