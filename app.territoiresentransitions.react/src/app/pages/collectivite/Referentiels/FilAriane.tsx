import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Link} from 'react-router-dom';
import {makeCollectiviteReferentielUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks';

/**
 * The nav bar at the to of an orientation page, made of several
 * OrientationSwitcher
 */
export const ActionFilAriane = ({action}: {action: ActionReferentiel}) => {
  const collectiviteId = useCollectiviteId()!;
  return (
    <div className="flex gap-2 text-sm opacity-80">
      <Link
        to={makeCollectiviteReferentielUrl({
          collectiviteId: collectiviteId,
          referentielId: action.referentiel,
        })}
      >
        {action.referentielDisplayName}
      </Link>
      <div>&gt;</div>
      <div className="truncate w-2/3">{action.displayName}</div>
    </div>
  );
};

export const ReferentielFilAriane = ({action}: {action: ActionReferentiel}) => {
  return (
    <div className="flex gap-2 text-sm opacity-80">
      {action.referentielDisplayName}
    </div>
  );
};
