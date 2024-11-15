import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { PlanNode } from './data/types';
import { useDeleteAxe } from './data/useDeleteAxe';

type Props = {
  children: JSX.Element;
  planId: number;
  axe: PlanNode;
  axeHasFiche: boolean;
  redirectURL?: string;
};

/**
 * Modale pour supprimer un axe.
 * Utilisée pour supprimer aussi bien un plan qu'un sous-axe
 */
const SupprimerAxeModal = ({
  children,
  planId,
  axe,
  axeHasFiche,
  redirectURL,
}: Props) => {
  const { mutate: deletePlan } = useDeleteAxe(axe.id, planId, redirectURL);

  const isPlan = axe.id === planId;

  return (
    <Modal
      dataTest="SupprimerFicheModale"
      size={axeHasFiche ? 'lg' : 'md'}
      title={
        isPlan
          ? 'Souhaitez-vous vraiment supprimer ce plan ?'
          : 'Souhaitez-vous vraiment supprimer ce niveau ?'
      }
      description={
        axeHasFiche
          ? undefined
          : `Il n'y a aucune fiche dans ce ${
              isPlan ? 'plan' : 'niveau'
            } et son arborescence.`
      }
      render={
        axeHasFiche
          ? () => (
              <Alert
                state="warning"
                title="Attention : les fiches liées à ce niveau seront également supprimées !"
                description="Les fiches liées à un autre niveau ou mutualisées dans un autre plan seront cependant conservées à cet autre emplacement."
              />
            )
          : undefined
      }
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              deletePlan();
              close();
            },
          }}
        />
      )}
    >
      {children}
    </Modal>
  );
};

export default SupprimerAxeModal;
