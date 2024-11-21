import { useState } from 'react';

import PlanTypeDropdown from '../PlanTypeDropdown';
import { PlanNode } from '../data/types';
import { useEditAxe } from '../data/useEditAxe';
import { TPlanType } from 'types/alias';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

type Props = {
  type?: TPlanType;
  axe: PlanNode;
  isAxePage: boolean;
  openState: OpenState;
};

/**
 * Modale pour modifier un plan d'action.
 */
const ModifierPlanModale = ({ type, axe, isAxePage, openState }: Props) => {
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
      title={isAxePage ? "Modifier l'axe" : 'Modifier le plan d’action'}
      render={() => (
        <>
          <Field
            title={isAxePage ? "Titre de l'axe" : 'Nom du plan d’action'}
            hint={
              isAxePage
                ? ''
                : 'Exemple : Plan Climat Air Énergie territorial 2022-2026'
            }
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
          {!isAxePage && (
            <PlanTypeDropdown
              type={typedPlan?.type?.id}
              onSelect={(type) => setTypedPlan({ ...typedPlan, type })}
            />
          )}
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
