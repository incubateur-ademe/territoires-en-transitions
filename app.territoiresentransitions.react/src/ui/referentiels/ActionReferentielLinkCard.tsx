import {Link} from 'react-router-dom';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {makeCollectiviteActionUrl} from 'app/paths';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';
import {ArrowNarrowRightIcon} from '@heroicons/react/solid';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {referentielId} from 'utils/actions';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';
import {ActionReferentiel} from 'types/action_referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';

/**
 * Used on referentiels page, links to action page.
 */
export const ActionReferentielLinkCard = ({
  action,
}: {
  action: ActionReferentiel | ActionDefinitionSummary;
}) => {
  const collectiviteId =
    currentCollectiviteBloc.currentCollectivite?.collectivite_id;
  const referentiel = referentielId(action.id);
  return (
    <article>
      <div className="pt-8 flex flex-row justify-between">
        <div className="flex flex-col w-4/5">
          <Link
            to={makeCollectiviteActionUrl({
              collectiviteId: collectiviteId!,
              referentielId: referentiel,
              actionId: action.id,
            })}
            className="flex flex-row justify-between items-center"
          >
            <ActionReferentielDisplayTitle action={action} />
            <ArrowNarrowRightIcon className="w-5 h-5" />
          </Link>
          <ActionReferentielDescription action={action} />
        </div>
        <div className="w-1/6 pl-4">
          <ActionProgressBar action={action} scoreBloc={scoreBloc} />
        </div>
      </div>
    </article>
  );
};
