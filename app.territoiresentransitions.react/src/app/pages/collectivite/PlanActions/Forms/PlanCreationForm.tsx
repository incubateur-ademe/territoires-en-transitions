import {useState} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {LabeledTextInput} from 'app/pages/collectivite/PlanActions/Forms/LabeledTextInput';
import {createPlanAction} from 'core-logic/commands/plans';

export const PlanCreationForm = (props: {onSave: () => void}) => {
  const [nom, setNom] = useState<string>('');
  const collectiviteId = useCollectiviteId()!;

  const handleSave = async () => {
    if (!nom) return;
    await createPlanAction(collectiviteId, nom);
    props.onSave();
  };

  return (
    <div>
      <LabeledTextInput
        label="Nom du plan d'action"
        maxLength={100}
        value={nom}
        onChange={event => {
          setNom(event.target.value);
        }}
      />
      <div className="flex flex-row-reverse p-5">
        <button
          className="fr-btn"
          onClick={e => {
            e.preventDefault();
            handleSave();
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
};
