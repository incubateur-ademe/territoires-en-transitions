import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {indicateurPersonnaliseDefinitionRepository} from 'core-logic/api/repositories/IndicateurPersonnaliseDefinitionRepository';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import {IndicateurPersonnaliseDefinitionWrite} from 'generated/dataLayer/indicateur_personnalise_definition_write';
import React from 'react';
import {UiDialogButton} from 'ui/UiDialogButton';

export const IndicateurPersonnaliseEditionDialog = ({
  indicateur,
}: {
  indicateur: IndicateurPersonnaliseDefinitionRead;
}) => {
  const [editing, setEditing] = React.useState<boolean>(false);
  const onSave = (indicateur: IndicateurPersonnaliseDefinitionWrite) => {
    indicateurPersonnaliseDefinitionRepository.save(indicateur);
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
