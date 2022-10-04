import classNames from 'classnames';
import {Tooltip} from 'ui/shared/floating-ui/Tooltip';
import {TPreuve, TPreuveReglementaire} from './types';
import PreuveDoc from './PreuveDoc';
import {AddPreuveReglementaire} from 'ui/shared/actions/AddPreuve/AddPreuveReglementaire';
import {IdentifiantAction, isDisabledAction} from './IdentifiantAction';

export type TPreuveReglementaireProps = {
  preuves: TPreuveReglementaire[];
  noIdentifiant?: boolean;
};

/**
 * Affiche une preuve règlementaire et les éventuels documents associés
 */
export const PreuveReglementaire = (props: TPreuveReglementaireProps) => {
  const {preuves, noIdentifiant} = props;

  // n'affiche rien quand la liste est vide
  if (!preuves.length) {
    return null;
  }

  // lit les informations du 1er item (identiques aux suivants)
  const first = preuves[0];
  const {action, preuve_reglementaire, fichier, lien} = first;
  const {id: preuve_id, nom, description} = preuve_reglementaire;
  const isDisabled = isDisabledAction(action);
  const haveDoc = fichier || lien;

  return (
    <div className="flex flex-row gap-8 pt-2 pb-4" data-test="preuve">
      <div className="flex flex-1 flex-col">
        <span
          data-test="desc"
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
        {noIdentifiant ? null : <IdentifiantAction action={action} />}
      </div>
      <div className="flex flex-1 flex-col justify-center space-y-2">
        {haveDoc
          ? preuves.map(preuve => (
              <PreuveDoc key={preuve.id} preuve={preuve as TPreuve} />
            ))
          : null}
        <AddPreuveReglementaire preuve_id={preuve_id} isDisabled={isDisabled} />
      </div>
    </div>
  );
};
