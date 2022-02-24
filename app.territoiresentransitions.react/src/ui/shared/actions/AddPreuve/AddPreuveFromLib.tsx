/**
 * Affiche la bibliothèque de fichiers de la collectivité
 * et permet de sélectionner les fichiers à ajouter comme preuve
 */

import {ChangeEvent, FormEvent, useState} from 'react';
import {preuveWriteEndpoint} from 'core-logic/api/endpoints/PreuveWriteEndpoint';
import {useCollectiviteBucketFiles} from 'core-logic/hooks/preuve';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TActionPreuvePanelProps} from '../ActionPreuvePanel/ActionPreuvePanel';

export type TAddPreuveFromLibProps = TActionPreuvePanelProps & {
  onClose: () => void;
};

export const AddPreuveFromLib = (props: TAddPreuveFromLibProps) => {
  const {onClose, action} = props;

  const {bucketFiles} = useCollectiviteBucketFiles();
  const collectivite_id = useCollectiviteId();
  const [currentSelection, setCurrentSelection] = useState<{
    [key: string]: boolean;
  }>({});
  const canAdd = Object.values(currentSelection).find(v => !!v);

  const onChange = (e: ChangeEvent<HTMLFieldSetElement>) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
      const {target} = e as unknown as ChangeEvent<HTMLInputElement>;
      const {checked, name} = target;
      setCurrentSelection({...currentSelection, [name]: checked});
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (collectivite_id) {
      Promise.all(
        Object.entries(currentSelection)
          .filter(([, checked]) => checked)
          .map(([name]) =>
            preuveWriteEndpoint.save({
              action_id: action.id,
              collectivite_id,
              commentaire: '',
              filename: name,
            })
          )
      ).then(onClose);
    }
  };

  return (
    <>
      <h6 className="fr-text--md">Tous les fichiers de ma collectivité</h6>
      <form onSubmit={onSubmit}>
        <div className="fr-form-group">
          <fieldset className="fr-fieldset" onChange={onChange}>
            <div
              className="fr-fieldset__content overflow-auto"
              style={{maxHeight: '36vh'}}
            >
              {bucketFiles.map(({id, name}) => (
                <div className="fr-checkbox-group">
                  <input type="checkbox" name={name} id={id} className="py-0" />
                  <label className="fr-label" htmlFor={id}>
                    {name}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
        <button className="fr-btn mt-2" disabled={!canAdd} type="submit">
          Ajouter
        </button>
      </form>
    </>
  );
};
