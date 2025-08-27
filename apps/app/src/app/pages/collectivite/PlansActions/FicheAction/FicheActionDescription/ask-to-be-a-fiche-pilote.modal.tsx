import { useCollectiviteId } from '@/api/collectivites';
import { FicheResume } from '@/domain/plans/fiches';
import { Button, Modal, ModalFooterOKCancel } from '@/ui';

type AskToBeAFichePilotModalProps = {
  fiche: Pick<FicheResume, 'id' | 'titre' | 'plans'>;
};

/**
 * Bouton + modale de suppression d'une fiche action
 */
export const AskToBeAFichePilotModal = ({
  fiche,
}: AskToBeAFichePilotModalProps) => {
  const collectiviteId = useCollectiviteId();
  const { id, titre, plans } = fiche;

  return (
    <Modal
      title="Modifier la fiche"
      render={({ descriptionId }) => (
        // Texte d'avertissement
        <div id={descriptionId} data-test="supprimer-fiche-modale">
          <>
            <p className="mb-2">
              La modification de cette fiche est réservée aux personnes pilotes
              de la fiche et du plan.
            </p>
            <p className="mb-0">
              Souhaitez-vous être ajouté(e) comme pilote de cette fiche ?
            </p>
          </>
        </div>
      )}
      // Boutons pour valider / annuler la suppression
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              close();
            },
            children: 'Oui, je veux être pilote de cette fiche',
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        icon="edit-fill"
        title="Modifier les informations"
        variant="white"
        size="xs"
        className="h-fit"
      />
    </Modal>
  );
};
