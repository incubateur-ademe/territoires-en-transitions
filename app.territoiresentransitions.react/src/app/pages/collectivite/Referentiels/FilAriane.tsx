import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Link} from 'react-router-dom';

/**
 * The nav bar at the to of an orientation page, made of several
 * OrientationSwitcher
 */
export const OrientationFilAriane = ({action}: {action: ActionReferentiel}) => {
  return (
    <div className="flex gap-4 bg-yellow-200">
      <Link to={'#'}>{action.referentielDisplayName}</Link>
      <div> &gt; </div>
      <Link to={'#'}>
        <div className="truncate w-2/3">{action.displayName}</div>
      </Link>
    </div>
  );
};
