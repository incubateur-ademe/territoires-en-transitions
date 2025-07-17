import { Alert, Modal, ModalFooterOKCancel } from '@/ui';
import { useDeleteAxe } from '../data/use-delete-axe';
import { useDeletePlan } from '../data/use-delete-plan';

type Props = {
  children: JSX.Element;
  planId: number;
  axeId: number;
  axeHasFiche: boolean;
  redirectURL?: string;
};

export const DeletePlanOrAxeModal = ({
  children,
  planId,
  axeId,
  axeHasFiche,
  redirectURL,
}: Props) => {
  const isPlan = axeId === planId;

  const { mutateAsync: deletePlanOrAxe } = isPlan
    ? useDeletePlan(planId, redirectURL)
    : useDeleteAxe(axeId, planId, redirectURL);

  return (
    <Modal
      dataTest="SupprimerFicheModale"
      size={axeHasFiche ? 'lg' : 'md'}
      title={`Souhaitez-vous vraiment supprimer ce ${
        isPlan ? 'plan' : 'titre/axe'
      } ?`}
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
              deletePlanOrAxe();
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
