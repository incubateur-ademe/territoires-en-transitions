import {ActionReferentielAvancementCard} from 'ui/referentiels/ActionReferentielAvancementRecursiveCard';
import {ActionTitleRead} from 'core-logic/api/endpoints/ActionTitleReadEndpoint';
import {useActionSummary} from 'core-logic/hooks/referentiel';

/**
 * Displays an actions and it's children by loading its data from the endpoint
 *
 * Beware using this component is expensive as it causes an API call.
 */
export const ExpensiveActionReferentielAvancementCard = ({
  title,
}: {
  title: ActionTitleRead;
}) => {
  const action = useActionSummary(title.referentiel, title.identifiant);
  return action ? (
    <ActionReferentielAvancementCard
      action={action}
      displayAddFicheActionButton={false}
      displayProgressStat={true}
    />
  ) : (
    <span>{title.nom}</span>
  );
};
