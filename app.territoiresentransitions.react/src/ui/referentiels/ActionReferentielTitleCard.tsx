import {Link} from 'react-router-dom';
import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {ProgressStat} from 'ui/referentiels';
import {ActionDescriptionExpandPanel} from 'ui/shared';
import {ActionReferentielTitle} from './ActionReferentielTitle';
import {referentielToName} from 'app/labels';
import {Referentiel} from 'types';

export const ActionReferentielTitleCard = ({
  action,
  referentiel,
}: {
  action: ActionReferentiel;
  referentiel: Referentiel;
}) => {
  const displayProgressStat = referentiel === 'eci';

  return (
    <article className="bg-beige my-4 p-4">
      <Link
        to={`./action/${referentiel}/${action.id}`}
        className="LinkedCardHeader"
      >
        <div className="flex p-2 justify-between">
          <div>
            <span className="inline-block text-xs font-thin">
              {referentielToName[referentiel]}
            </span>
          </div>
          <ProgressStat
            className={`${displayProgressStat ? 'w-100' : 'hidden'}`}
            action={action}
            position="right"
          />
        </div>
        <div className="p-4 flex justify-between">
          <ActionReferentielTitle action={action} />
          <div className="fr-fi-arrow-right-line text-bf500" />
        </div>
      </Link>
      <div className="w-2/3">
        <ActionDescriptionExpandPanel action={action} />
      </div>
    </article>
  );
};
