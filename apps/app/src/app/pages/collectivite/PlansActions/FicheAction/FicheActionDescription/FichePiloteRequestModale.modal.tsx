import { useCollectiviteId } from '@/api/collectivites';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { useUser } from '@/api/users/user-provider';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { FicheResume } from '@/domain/plans/fiches';
import { Button, Modal, ModalFooterOKCancel } from '@/ui';

type FichePiloteRequestModaleProps = {
  fiche: Pick<FicheResume, 'id' | 'titre' | 'plans' | 'pilotes'>;
  planId?: number;
};

export const FichePiloteRequestModale = ({
  fiche,
  planId,
}: FichePiloteRequestModaleProps) => {
  const collectiviteId = useCollectiviteId();
  const user: UserDetails = useUser();
  const { mutate: updateFiche } = useUpdateFiche(
    planId ? { invalidatePlanId: planId } : undefined
  );

  const handleAddMeToPiloteFiche = () => {
    const piloteToAdd = {
      nom: user.nom,
      collectiviteId,
      userId: user.id,
      telephone: user.phone,
      email: user.email,
      tagId: null,
    };

    updateFiche({
      ficheId: fiche.id,
      ficheFields: { pilotes: [...(fiche.pilotes ?? []), piloteToAdd] },
    });
  };

  return (
    <Modal
      title="Modifier la fiche"
      render={({ descriptionId }) => (
        <div id={descriptionId} data-test="ajouter-pilote-fiche-modale">
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
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              handleAddMeToPiloteFiche();
              close();
            },
            children: 'Oui, je veux être pilote de cette fiche',
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        data-test="BoutonDeverrouillerFiche"
        icon="lock-line"
        variant="primary"
        size="xs"
      >
        <div className="whitespace-nowrap">Modifier la fiche</div>
      </Button>
    </Modal>
  );
};
