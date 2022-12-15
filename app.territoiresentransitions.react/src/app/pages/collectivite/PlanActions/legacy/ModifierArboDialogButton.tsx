import {Spacer} from 'ui/shared/Spacer';
import {useState} from 'react';
import {PlanEditionForm} from './Forms/PlanEditionForm';
import {PlanActionRead} from 'generated/dataLayer/plan_action_read';
import {UiDialogButton} from 'ui/UiDialogButton';

export const ModifierArboDialogButton = (props: {plan: PlanActionRead}) => {
  const [editing, setEditing] = useState<boolean>(false);

  return (
    <UiDialogButton
      title="Modifier l'arborescence"
      opened={editing}
      setOpened={setEditing}
      buttonClasses="fr-btn--secondary"
    >
      <Spacer />
      <PlanEditionForm plan={props.plan} />
    </UiDialogButton>
  );
};
