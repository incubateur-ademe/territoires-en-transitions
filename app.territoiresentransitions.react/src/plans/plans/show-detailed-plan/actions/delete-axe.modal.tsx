import { Alert, Modal, ModalFooterOKCancel } from '@/ui';
import { useDeleteAxe } from '../../../../app/pages/collectivite/PlansActions/PlanAction/data/useDeleteAxe';
import { PlanNode } from '../../types';

type Props = {
  children: JSX.Element;
  rootAxe: PlanNode;
  axe: PlanNode;
  axeHasFiche: boolean;
  redirectURL?: string;
};

/**
 * Modale pour supprimer un axe.
 * Utilisée pour supprimer aussi bien un plan qu'un sous-axe
 */
export const DeleteAxeModal = ({
  children,
  rootAxe,
  axe,
  axeHasFiche,
  redirectURL,
}: Props) => {
  const { mutate: deletePlan } = useDeleteAxe(axe.id, rootAxe.id, redirectURL);

  const isPlan = axe.id === rootAxe.id;

  return (
    <Modal
      dataTest="SupprimerFicheModale"
      size={axeHasFiche ? 'lg' : 'md'}
      title={
        isPlan
          ? 'Souhaitez-vous vraiment supprimer ce plan ?'
          : 'Souhaitez-vous vraiment supprimer ce titre/axe ?'
      }
      description={
        axeHasFiche
          ? undefined
          : `Il n'y a aucune fiche dans ce ${
              isPlan ? 'plan' : 'titre/axe'
            } et son arborescence.`
      }
      render={
        axeHasFiche
          ? () => (
              <Alert
                state="warning"
                title="Attention : les fiches liées à ce titre/axe seront également supprimées !"
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

export default DeleteAxeModal;
