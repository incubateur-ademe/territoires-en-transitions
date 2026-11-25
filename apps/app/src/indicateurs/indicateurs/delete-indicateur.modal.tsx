import { useDeleteIndicateur } from '@/app/indicateurs/indicateurs/use-delete-indicateur';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { OpenState } from '@tet/ui/utils/types';
import { DeleteIndicateurConfirmationModal } from './delete-indicateur-confirmation.modal';

/**
 * Modale pour la suppression d'un indicateur personnalisé
 */
type Props = {
  indicateur: Pick<IndicateurDetaille, 'id' | 'titre' | 'enfants'>;
  openState: OpenState;
  redirectAfterDelete?: boolean;
};

export const DeleteIndicateurModal = ({
  indicateur,
  openState,
  redirectAfterDelete,
}: Props) => {
  const { mutate: deleteIndicateur } = useDeleteIndicateur(indicateur.id, {
    redirectAfterDelete,
  });
  return (
    <DeleteIndicateurConfirmationModal
      titre={indicateur.titre}
      enfantsCount={indicateur.enfants.length}
      openState={openState}
      onConfirm={() => deleteIndicateur()}
    />
  );
};
