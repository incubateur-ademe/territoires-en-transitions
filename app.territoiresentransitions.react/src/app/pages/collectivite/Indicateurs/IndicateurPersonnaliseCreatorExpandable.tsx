import React from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {v4 as uuid} from 'uuid';

import {IndicateurPersonnaliseInterface} from 'generated/models/indicateur_personnalise';
import {useEpciId} from 'core-logic/hooks';
import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {indicateurPersonnaliseStore} from 'core-logic/api/hybridStores';

const IndicateurPersonnaliseCreator = (props: {onClose: () => void}) => {
  const epciId = useEpciId();
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
    props.onClose();
  };

  return <IndicateurPersonnaliseForm indicateur={data} onSave={onSave} />;
};

export const IndicateurPersonnaliseCreatorExpandable = (props: {
  buttonClasses?: string;
}) => {
  const [creating, setCreating] = React.useState<boolean>(false);

  return (
    <div className="app mt-5">
      <div>
        {!creating && (
          <div>
            <button
              className={`fr-btn ${props.buttonClasses ?? ''}`}
              onClick={() => setCreating(true)}
            >
              Créer un nouvel indicateur
            </button>
          </div>
        )}
      </div>
      {creating && (
        <div className="w-2/3 mb-5 border-bf500 border-l-4 pl-4">
          <div className="flex flex-row justify-between">
            <h3 className="fr-h3">Nouvel indicateur</h3>
            <button
              className="fr-btn fr-btn--secondary"
              onClick={() => setCreating(false)}
            >
              x
            </button>
          </div>
          <IndicateurPersonnaliseCreator onClose={() => setCreating(false)} />
        </div>
      )}
    </div>
  );
};
