import classNames from 'classnames';
import {Tooltip} from 'ui/shared/floating-ui/Tooltip';
import {TPreuve, TPreuveReglementaire} from './types';
import {EditablePreuveDoc} from './PreuveDoc';
import {AddPreuveReglementaire} from 'ui/shared/actions/AddPreuve/AddPreuveReglementaire';

export type TPreuveReglementaireProps = {
  preuves: TPreuveReglementaire[];
};

/**
 * Affiche une preuve règlementaire et les éventuels documents associés
 */
export const PreuveReglementaire = (props: TPreuveReglementaireProps) => {
  const {preuves} = props;

  // n'affiche rien quand la liste est vide
  if (!preuves.length) {
    return null;
  }

  // lit les informations du 1er item (identiques aux suivants)
  const first = preuves[0];
  const {action, preuve_reglementaire, fichier, lien} = first;
  const {identifiant, concerne, desactive} = action;
  const {id: preuve_id, nom, description} = preuve_reglementaire;
  const isDisabled = !concerne || desactive;
  const haveDoc = fichier || lien;

  return (
    <div className="flex flex-row gap-8 pt-2 pb-4">
      <div className="flex flex-1 flex-col">
        <span
          className={classNames('fr-text--sm pt-2', {
            'text-black': !isDisabled,
            'text-grey25': isDisabled,
          })}
        >
          {nom}
          {description ? (
            <Tooltip label={description} activatedBy="click">
              <span className="fr-fi-information-line pl-4 text-bf500 cursor-pointer" />
            </Tooltip>
          ) : null}
        </span>
        <span className="text-xs text-grey625">
          {identifiant}
          {isDisabled ? (
            <span className="fr-badge fr-ml-4w fr-text-mention--grey fr-text--xs">
              Non concerné
            </span>
          ) : null}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center space-y-2">
        {haveDoc
          ? preuves.map(preuve => (
              <EditablePreuveDoc key={preuve.id} preuve={preuve as TPreuve} />
            ))
          : null}
        <AddPreuveReglementaire preuve_id={preuve_id} isDisabled={isDisabled} />
      </div>
    </div>
  );
};
