import React from 'react';
import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {UiDialogButton} from 'ui/UiDialogButton';
import {useUpsertIndicateurPersoDefinition} from './useUpsertIndicateurPersoDefinition';
import {TIndicateurPersoDefinition} from './useIndicateursPersoDefinitions';

export const IndicateurPersonnaliseEditionDialog = ({
  indicateur,
}: {
  indicateur: TIndicateurPersoDefinition;
}) => {
  const [editing, setEditing] = React.useState(false);
  const {mutate: save} = useUpsertIndicateurPersoDefinition();

  return (
    <div>
      <UiDialogButton
        buttonClasses="fr-btn--secondary"
        title="Modifier l'indicateur"
        opened={editing}
        setOpened={setEditing}
      >
        <IndicateurPersonnaliseForm
          indicateur={indicateur}
          onSave={indicateur => {
            save(indicateur);
            setEditing(false);
          }}
        />
      </UiDialogButton>
    </div>
  );
};
