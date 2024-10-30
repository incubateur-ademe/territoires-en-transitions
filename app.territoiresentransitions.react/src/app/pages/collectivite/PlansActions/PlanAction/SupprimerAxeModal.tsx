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
    // <Modal
    //   noCloseButton
    //   render={({labelId, descriptionId, close}) => {
    //     return (
    //       <div data-test="SupprimerFicheModale" className="mt-2">
    //         <h6 id={labelId} className="fr-h6">
    //           {isPlan
    //             ? 'Souhaitez-vous vraiment supprimer ce plan ?'
    //             : 'Souhaitez-vous vraiment supprimer ce niveau ?'}
    //         </h6>
    //         {/** Vérifie si un axe contient un ou plusieurs fiches */}
    //         {axeHasFiche ? (
    //           <>
    //             <p id={descriptionId} className="mb-4">
    //               {isPlan
    //                 ? 'Souhaitez-vous supprimer ce plan, son arborescence et les fiches qui y sont liées ?'
    //                 : 'Souhaitez-vous supprimer ce niveau et les fiches qui y sont liées ?'}
    //             </p>
    //             <p id={descriptionId} className="mb-8 text-sm text-gray-500">
    //               *Les fiches rattachées à un autre niveau ou à un autre plan
    //               seront bien entendu conservées à cet autre emplacement.
    //             </p>
    //           </>
    //         ) : (
    //           <p id={descriptionId} className="mb-4">
    //             {`Il n'y a aucune fiche dans ce ${
    //               isPlan ? 'plan' : 'niveau'
    //             } et son arborescence.`}
    //           </p>
    //         )}
    //         <div className="mt-8 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
    //           <button
    //             onClick={close}
    //             className="fr-btn fr-btn--secondary"
    //             aria-label="Annuler"
    //           >
    //             Annuler
    //           </button>
    //           <button
    //             onClick={() => {
    //               deletePlan();
    //               close();
    //             }}
    //             aria-label="Confirmer"
    //             className="fr-btn"
    //           >
    //             Confirmer
    //           </button>
    //         </div>
    //       </div>
    //     );
    //   }}
    // >
    //   {children}
    // </Modal>
  );
};

export default SupprimerAxeModal;
