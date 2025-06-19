import { useState } from 'react';

import { TPlanType } from '@/app/types/alias';
import { Field, Input, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import PlanTypeDropdown from '../PlanTypeDropdown';
import { PlanNode } from '../data/types';
import { useEditAxe } from '../data/useEditAxe';

type Props = {
  type: TPlanType | null;
  axe: PlanNode;
  openState: OpenState;
};

/**
 * Modale pour modifier un plan d'action.
 */
const ModifierPlanModale = ({ type, axe, openState }: Props) => {
  const { mutate: updateAxe } = useEditAxe(axe.id);

  const initialTypedPlan = { ...axe, type };

  const [typedPlan, setTypedPlan] = useState(initialTypedPlan);

  const handleEditAxe = (close: () => void) => {
    updateAxe(typedPlan);
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
              value={typedPlan.nom}
              onChange={(e) =>
                setTypedPlan({ ...typedPlan, nom: e.target.value })
              }
              placeholder="Sans titre"
              autoFocus
            />
          </Field>
          <PlanTypeDropdown
            type={typedPlan?.type?.id}
            onSelect={(type) =>
              setTypedPlan({ ...typedPlan, type: type || null })
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
