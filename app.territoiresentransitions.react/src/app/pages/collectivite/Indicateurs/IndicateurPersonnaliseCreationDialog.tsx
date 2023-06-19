import {useState} from 'react';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {UiDialogButton} from 'ui/UiDialogButton';
import {IndicateurPersonnaliseCreator} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCreator';

export const IndicateurPersonnaliseCreationDialog = () => {
  const currentCollectivite = useCurrentCollectivite();
  const [editing, setEditing] = useState(false);

  return currentCollectivite && !currentCollectivite.readonly ? (
    <UiDialogButton
      title="Créer un indicateur"
      opened={editing}
      setOpened={setEditing}
      buttonClasses="fr-ml-4w fr-btn--tertiary"
    >
      <IndicateurPersonnaliseCreator onClose={() => setEditing(false)} />
    </UiDialogButton>
  ) : null;
};
