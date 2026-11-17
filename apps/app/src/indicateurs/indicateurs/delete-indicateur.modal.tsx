import { useDeleteIndicateur } from '@/app/indicateurs/indicateurs/use-delete-indicateur';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { OpenState } from '@tet/ui/utils/types';
import { DeleteIndicateurConfirmModal } from './delete-indicateur-confirmation.modal';

/**
 * Modale pour la suppression d'un indicateur personnalisé
 */
type Props = {
  indicateur: Pick<IndicateurDetaille, 'id' | 'titre'>;
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
    <DeleteIndicateurConfirmModal
      titre={indicateur.titre}
      openState={openState}
      onConfirm={() => deleteIndicateur()}
    />
  );
};
