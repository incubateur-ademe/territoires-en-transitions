import React from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {IndicateurPersonnaliseInterface} from 'generated/models/indicateur_personnalise';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';

import {UiDialogButton} from 'ui/UiDialogButton';

export const IndicateurPersonnaliseEditionDialog = ({
  indicateur,
}: {
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  const [editing, setEditing] = React.useState<boolean>(false);
  const onSave = (indicateur: IndicateurPersonnaliseInterface) => {
    indicateurPersonnaliseStore.store(
      new IndicateurPersonnaliseStorable(indicateur)
    );
    setEditing(false);
  };
  return (
    <div>
      <UiDialogButton
        buttonClasses="fr-btn--secondary"
        title="Modifier l'indicateur"
        opened={editing}
        setOpened={setEditing}
      >
        <IndicateurPersonnaliseForm indicateur={indicateur} onSave={onSave} />
      </UiDialogButton>
    </div>
  );
};
