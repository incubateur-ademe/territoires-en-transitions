import { ButtonProps, EmptyCard } from '@/ui';
import DatavizPicto from './DatavizPicto';

type IndicateursAssociesEmptyProps = {
  canCreateIndicateur: boolean;
  isReadonly: boolean;
  onCreateIndicateur: () => void;
  onAssociateIndicateur: () => void;
};

export const IndicateursAssociesEmpty = ({
  canCreateIndicateur,
  isReadonly,
  onCreateIndicateur,
  onAssociateIndicateur,
}: IndicateursAssociesEmptyProps) => {
  const actions: (ButtonProps & { isVisible: boolean })[] = [
    {
      isVisible: canCreateIndicateur,
      children: 'Créer un indicateur',
      icon: 'add-line',
      onClick: onCreateIndicateur,
      variant: 'outlined',
    },
    {
      isVisible: true,
      children: 'Associer des indicateurs',
      icon: 'link',
      onClick: onAssociateIndicateur,
      variant: 'primary',
    },
  ];

  return (
    <EmptyCard
      picto={(props) => <DatavizPicto {...props} />}
      title="Aucun indicateur associé !"
      subTitle="Observez votre progression grâce aux indicateurs"
      isReadonly={isReadonly}
      actions={actions.filter((action) => action.isVisible)}
      size="xs"
    />
  );
};
