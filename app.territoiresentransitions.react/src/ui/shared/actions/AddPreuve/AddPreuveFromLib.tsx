/**
 * Affiche la bibliothèque de fichiers de la collectivité
 */

import {
  useCollectiviteBucketFiles,
  usePreuveFichiers,
} from 'core-logic/hooks/preuve';
import {TActionPreuvePanelProps} from '../ActionPreuvePanel/ActionPreuvePanel';

export type TAddPreuveFromLibProps = TActionPreuvePanelProps & {
  onClose: () => void;
};

export const AddPreuveFromLib = (props: TAddPreuveFromLibProps) => {
  const {onClose, action} = props;

  const {bucketFiles} = useCollectiviteBucketFiles();

  return (
    <>
      <h6 className="fr-text--md">Tous les fichiers de ma collectivité</h6>
      <div className="fr-form-group">
        <fieldset className="fr-fieldset">
          <div className="fr-fieldset__content">
            {bucketFiles.map(({name}) => (
              <div className="fr-checkbox-group">
                <input type="checkbox" name={name} id={name} />
                <label className="fr-label fr-text--sm" htmlFor={name}>
                  {name}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>
    </>
  );
};
