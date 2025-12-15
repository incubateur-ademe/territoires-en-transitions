import { PlanNode } from '@tet/domain/plans';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { useRestreindreFiches } from '../../../../app/pages/collectivite/PlansActions/FicheAction/data/useRestreindreFiches';

type Props = {
  children: JSX.Element;
  planId: number;
  axes: PlanNode[];
  restreindre: boolean;
};

/**
 * Modale pour modifier la confidentialité des actions d'un plan.
 */
const RestreindreFichesModal = ({
  children,
  planId,
  axes,
  restreindre,
}: Props) => {
  const { mutate: restreindrePlan } = useRestreindreFiches(axes);
  return (
    <Modal
      textAlign="left"
      title={
        restreindre
          ? 'Souhaitez-vous rendre privées toutes les actions de ce plan ?'
          : 'Souhaitez-vous rendre publiques toutes les actions de ce plan ?'
      }
      description={
        restreindre
          ? "En passant en privé l'ensemble des actions de ce plan, elles ne seront plus accessibles par les personnes n’étant pas membres de votre collectivité. Les actions restent consultables par l’ADEME et le service support de la plateforme."
          : "En passant en public l'ensemble des actions de ce plan, elles seront accessibles à toutes les personnes n’étant pas membres de votre collectivité."
      }
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            'aria-label': 'Confirmer',
            children: 'Confirmer',
            onClick: () => {
              restreindrePlan({ plan_id: planId, restreindre });
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

export default RestreindreFichesModal;
