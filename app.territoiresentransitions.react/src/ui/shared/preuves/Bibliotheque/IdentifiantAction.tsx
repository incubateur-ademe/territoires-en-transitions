import {TPreuveAction} from './types';

export type TIdentifiantActionProps = {
  action: TPreuveAction;
};

/**
 * Affiche l'identifiant d'une action à laquelle une preuve est associée
 */
export const IdentifiantAction = (props: TIdentifiantActionProps) => {
  const {action} = props;
  const {identifiant} = action;

  return (
    <span className="text-xs text-grey625">
      {identifiant}
      {isDisabledAction(action) ? (
        <span className="fr-badge fr-ml-4w fr-text-mention--grey fr-text--xs">
          Non concerné
        </span>
      ) : null}
    </span>
  );
};

export const isDisabledAction = (action: TPreuveAction) => {
  const {concerne, desactive} = action;
  return !concerne || desactive;
};
