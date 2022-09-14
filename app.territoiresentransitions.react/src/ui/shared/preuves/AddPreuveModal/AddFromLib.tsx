/**
 * Affiche la bibliothèque de fichiers de la collectivité
 * et permet de sélectionner les fichiers à ajouter comme preuve
 */

import {ChangeEvent, FormEvent, useState} from 'react';
import {useFichiers} from '../Bibliotheque/useFichiers';
import {TAddFileFromLib} from './AddFile';

export type TAddFromLibProps = {
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

export const AddFromLib = (props: TAddFromLibProps) => {
  const {onAddFileFromLib, onClose} = props;

  const fichiers = useFichiers();
  const [currentSelection, setCurrentSelection] = useState<{
    [key: number]: boolean;
  }>({});
  const canAdd = Object.values(currentSelection).find(v => !!v);

  const onChange = (e: ChangeEvent<HTMLFieldSetElement>) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
      const {target} = e as unknown as ChangeEvent<HTMLInputElement>;
      const {checked, id} = target;
      setCurrentSelection({...currentSelection, [id]: checked});
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    Promise.all(
      Object.entries(currentSelection)
        .filter(([, checked]) => checked)
        .map(([id]) => onAddFileFromLib(parseInt(id)))
    ).then(onClose);
  };

  return (
    <>
      <h6 className="fr-text--md">Tous les fichiers de ma collectivité</h6>
      <form data-test="AddFromLib" onSubmit={onSubmit}>
        <div className="fr-form-group">
          <fieldset className="fr-fieldset" onChange={onChange}>
            <div
              className="fr-fieldset__content overflow-auto"
              style={{maxHeight: '25vh'}}
            >
              {fichiers.map(({id, filename}) => (
                <div key={id} className="fr-checkbox-group">
                  <input
                    type="checkbox"
                    name={filename}
                    id={`${id}`}
                    className="py-0"
                  />
                  <label className="fr-label" htmlFor={`${id}`}>
                    {filename}
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
