import {Badge} from '@tet/ui';
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
    <span className="text-grey-6 leading-6 flex gap-2">
      ({identifiant})
      {isDisabledAction(action) ? (
        <Badge title="Non concerné" size="sm" state="grey" />
      ) : null}
    </span>
  );
};

export const isDisabledAction = (action: TPreuveAction) => {
  const {concerne, desactive} = action;
  return !concerne || desactive;
};
