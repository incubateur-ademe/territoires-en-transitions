import React from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {v4 as uuid} from 'uuid';

import {IndicateurPersonnaliseInterface} from 'generated/models/indicateur_personnalise';
import {useEpciSiren} from 'core-logic/hooks';
import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';
import {UiDialogButton} from 'ui/UiDialogButton';

export const IndicateurPersonnaliseCreationDialog = ({
  buttonClasses,
}: {
  buttonClasses?: string;
}) => {
  const [editing, setEditing] = React.useState<boolean>(false);
  const epciId = useEpciSiren();
  const freshData = (): IndicateurPersonnaliseInterface => {
    return {
      epci_id: epciId!,
      uid: uuid(),
      custom_id: '',
      nom: '',
      description: '',
      unite: '',
      meta: {
        commentaire: '',
      },
    };
  };

  const [data, setData] = React.useState<IndicateurPersonnaliseInterface>(
    freshData()
  );

  const onSave = (indicateur: IndicateurPersonnaliseInterface) => {
    indicateurPersonnaliseStore.store(
      new IndicateurPersonnaliseStorable(indicateur)
    );
    setData(freshData());
    setEditing(false);
  };

  return (
    <UiDialogButton
      title="Créer un nouvel indicateur"
      opened={editing}
      setOpened={setEditing}
      buttonClasses={buttonClasses}
    >
      <IndicateurPersonnaliseForm indicateur={data} onSave={onSave} />
    </UiDialogButton>
  );
};
