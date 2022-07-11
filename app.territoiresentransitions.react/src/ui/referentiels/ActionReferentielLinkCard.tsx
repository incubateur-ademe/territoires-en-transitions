import {Link} from 'react-router-dom';
import {makeCollectiviteActionUrl} from 'app/paths';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';
import {ArrowNarrowRightIcon} from '@heroicons/react/solid';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {referentielId} from 'utils/actions';
import ActionProgressBar from 'ui/referentiels/ActionProgressBar';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Used on referentiels page, links to action page.
 */
export const ActionReferentielLinkCard = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const collectiviteId = useCollectiviteId();
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
          <ActionProgressBar actionId={action.id} />
        </div>
      </div>
    </article>
  );
};
