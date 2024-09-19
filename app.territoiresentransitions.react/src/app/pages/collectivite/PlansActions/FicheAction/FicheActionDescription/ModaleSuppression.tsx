import { QueryKey } from 'react-query';
import { ButtonVariant, Modal, ModalFooterOKCancel } from '@tet/ui';
import { useDeleteFicheAction } from '../data/useDeleteFicheAction';
import DeleteButton from '../DeleteButton';

type ModaleSuppressionProps = {
  ficheId: number | null;
  title: string | null;
  isInMultipleAxes: boolean;
  axeId?: number | null;
  keysToInvalidate?: QueryKey[];
  buttonVariant?: 'white' | 'grey';
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
const ModaleSuppression = ({
  ficheId,
  title,
  isInMultipleAxes,
  axeId,
  keysToInvalidate,
  buttonVariant,
}: ModaleSuppressionProps) => {
  const { mutate: deleteFiche } = useDeleteFicheAction({
    ficheId: ficheId!,
    axeId: axeId ?? null,
    keysToInvalidate: keysToInvalidate,
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
      />
    </Modal>
  );
};

export default ModaleSuppression;
