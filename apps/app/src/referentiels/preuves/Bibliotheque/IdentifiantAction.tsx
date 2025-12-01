import { Badge } from '@tet/ui';
import { TPreuveAction } from './types';

export type TIdentifiantActionProps = {
  action: TPreuveAction;
};

/**
 * Affiche l'identifiant d'une action à laquelle une preuve est associée
 */
export const IdentifiantAction = (props: TIdentifiantActionProps) => {
  const { action } = props;
  const { identifiant } = action;

  return (
    <span className="text-grey-8 text-sm font-medium flex gap-2">
      ({identifiant})
      {isDisabledAction(action) ? (
        <Badge
          title="Non concerné"
          size="sm"
          state="grey"
          trim={false}
          className="whitespace-nowrap"
        />
      ) : null}
    </span>
  );
};

export const isDisabledAction = (action: TPreuveAction) => {
  const { concerne, desactive } = action;
  return concerne === false || desactive === true;
};
