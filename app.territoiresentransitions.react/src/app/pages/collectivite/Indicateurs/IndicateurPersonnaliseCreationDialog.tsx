import {IndicateurPersonnaliseCreator} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCreator';
import React from 'react';
import {UiDialogButton} from 'ui/UiDialogButton';

export const IndicateurPersonnaliseCreationDialog = ({
  buttonClasses,
}: {
  buttonClasses?: string;
}) => {
  const [editing, setEditing] = React.useState<boolean>(false);
  return (
    <UiDialogButton
      title="Créer un nouvel indicateur"
      opened={editing}
      setOpened={setEditing}
      buttonClasses={buttonClasses}
    >
      <IndicateurPersonnaliseCreator onClose={() => setEditing(false)} />
    </UiDialogButton>
  );
};
