import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { referentielId } from '@/app/referentiels/actions.utils';
import ActionProgressBar from '@/app/referentiels/actions/action.progress-bar';
import Link from 'next/link';
import { ActionDescriptionHtml } from './action-description.html';
import { ActionTitleWithScorePotentielHeader } from './action-title-with-score-potentiel.header';

/**
 * Used on referentiels page, links to action page.
 */
export const ActionOverviewLink = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const referentiel = referentielId(action.id);
  return (
    <article>
      <div className="pt-8 flex flex-row justify-between">
        <div className="flex flex-col w-4/5">
          <Link
            href={makeCollectiviteActionUrl({
              collectiviteId,
              referentielId: referentiel,
              actionId: action.id,
            })}
            className="flex flex-row justify-between items-center"
          >
            <ActionTitleWithScorePotentielHeader actionDefinition={action} />
            <div className="flex fr-icon-arrow-right-line before:!w-5 before:!h-5" />
          </Link>
          <ActionDescriptionHtml action={action} />
        </div>
        <div className="w-1/6 pl-4">
          <ActionProgressBar actionDefinition={action} />
        </div>
      </div>
    </article>
  );
};
