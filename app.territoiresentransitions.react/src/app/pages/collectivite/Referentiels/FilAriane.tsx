import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Link} from 'react-router-dom';
import {makeCollectiviteReferentielUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks';

/**
 * The nav bar at the to of an orientation page, made of several
 * OrientationSwitcher
 */
export const OrientationFilAriane = ({action}: {action: ActionReferentiel}) => {
  const collectiviteId = useCollectiviteId()!;
  return (
    <div className="flex gap-4">
      <Link
        to={makeCollectiviteReferentielUrl({
          collectiviteId: collectiviteId,
          referentielId: action.referentiel,
        })}
      >
        {action.referentielDisplayName}
      </Link>
      <div> &gt; </div>
      <div className="truncate w-2/3">{action.displayName}</div>
    </div>
  );
};
