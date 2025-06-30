import { useState } from 'react';

import { TPlanType } from '@/app/types/alias';
import { Field, Input, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { PlanNode } from '../../types';
import { useEditAxe } from '../data/useEditAxe';
import PlanTypeDropdown from '../PlanTypeDropdown';

type Props = {
  plan: PlanNode;
  type: TPlanType | null;
  openState: OpenState;
};

/**
 * Modale pour modifier un plan d'action.
 */
const ModifierPlanModale = ({ type, plan, openState }: Props) => {
  const { mutate: updateAxe } = useEditAxe(plan.id);

  const [updatedPlan, onUpdatePlan] = useState({ ...plan, type });

  const handleEditAxe = (close: () => void) => {
    updateAxe(updatedPlan);
    close();
  };

  return (
    <Modal
      dataTest="ModifierPlanTitreModale"
      openState={openState}
      title="Modifier le plan d’action"
      render={() => (
        <>
          <Field
            title="Nom du plan d’action"
            hint="Exemple : Plan Climat Air Énergie territorial 2022-2026"
          >
            <Input
              type="text"
              data-test="PlanNomInput"
              value={updatedPlan.nom}
              onChange={(e) =>
                onUpdatePlan({ ...updatedPlan, nom: e.target.value })
              }
              placeholder="Sans titre"
              autoFocus
            />
          </Field>
          <PlanTypeDropdown
            type={updatedPlan?.type?.id}
            onSelect={(type) =>
              onUpdatePlan({ ...updatedPlan, type: type || null })
            }
          />
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            onClick: () => handleEditAxe(close),
          }}
        />
      )}
    />
  );
};

export default ModifierPlanModale;
