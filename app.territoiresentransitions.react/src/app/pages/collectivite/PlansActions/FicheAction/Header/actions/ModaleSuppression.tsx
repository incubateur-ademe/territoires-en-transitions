import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Modal, ModalFooterOKCancel } from '@/ui';
import { useDeleteFicheAction } from '../../data/useDeleteFicheAction';

type ModaleSuppressionProps = {
  isReadonly?: boolean;
  ficheId: number | null;
  title: string | null;
  isInMultipleAxes: boolean;
  axeId?: number | null;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  /** Redirige vers le plan ou la page toutes les fiches action à la suppression de la fiche */
  redirect?: boolean;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const ModaleSuppression = ({
  isReadonly = true,
  ficheId,
  title,
  isInMultipleAxes,
  axeId,
  buttonVariant,
  buttonClassName,
  redirect,
}: ModaleSuppressionProps) => {
  const { mutate: deleteFiche } = useDeleteFicheAction({
    ficheId: ficheId!,
    axeId: axeId ?? null,
    redirect,
  });

  return (
    <Modal
      title="Supprimer la fiche"
      subTitle={title || 'Fiche sans titre'}
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          {isInMultipleAxes ? (
            <>
              <p className="mb-2">
                Cette fiche action est présente dans plusieurs plans.
              </p>
              <p className="mb-0">
                Souhaitez-vous vraiment supprimer cette fiche de tous les plans
                ?
              </p>
            </>
          ) : (
            <p className="mb-0">
              Souhaitez-vous vraiment supprimer cette fiche action ?
            </p>
          )}
        </div>
      )}
      // Boutons pour valider / annuler la suppression
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              deleteFiche();
              close();
            },
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <DeleteButton
        data-test="SupprimerFicheBouton"
        title="Supprimer la fiche"
        variant={buttonVariant}
        size="xs"
        className={buttonClassName}
        disabled={isReadonly}
      />
    </Modal>
  );
};

export default ModaleSuppression;
