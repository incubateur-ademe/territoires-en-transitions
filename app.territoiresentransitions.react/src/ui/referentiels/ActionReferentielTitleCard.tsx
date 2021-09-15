import {Link} from 'react-router-dom';
import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {
  ActionDescriptionExpandPanel,
  ActionExemplesExpandPanel,
} from 'ui/shared';
import {ProgressStatStatic} from 'ui/referentiels';
import {ActionReferentielTitle} from './ActionReferentielTitle';
import {referentielToName} from 'app/labels';
import {Referentiel} from 'types';
import {getCurrentEpciId} from 'core-logic/api/currentEpci';

export const ActionReferentielTitleCard = ({
  action,
  referentiel,
}: {
  action: ActionReferentiel;
  referentiel: Referentiel;
}) => {
  return (
    <article className="bg-beige my-4">
      <Link
        to={`/collectivite/${getCurrentEpciId()}/action/${referentiel}/${
          action.id
        }`}
        className="LinkedCardHeader"
      >
        <div className="flex p-4 justify-between">
          <div>
            <span className="inline-block text-xs font-thin">
              {referentielToName[referentiel]}
            </span>
          </div>
          <ProgressStatStatic
            className="w-100"
            action={action}
            position="right"
            showPoints={true}
          />
        </div>
        <div className="p-4 flex justify-between">
          <ActionReferentielTitle action={action} />
          <div className="fr-fi-arrow-right-line text-bf500" />
        </div>
      </Link>
      <div className="p-4 w-2/3">
        <ActionDescriptionExpandPanel action={action} />
        <ActionExemplesExpandPanel action={action} />
      </div>
    </article>
  );
};
