import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {ActionProgressBar, ActionReferentielDisplayTitle} from '.';
import {ActionCommentaire, ActionExemplesExpandPanel} from 'ui/shared';
import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionStatusDropdown} from 'ui/shared/actions/ActionStatusDropdown';
import {addTargetToContentAnchors} from 'utils/content';

/**
 * Displays an actions and it's children indented below.
 *
 * @param action
 * @param card
 * @param marginLeft the accumulated margin passed down to children for
 * indentation, beware the resulting tailwind classes have to be excluded
 * from purge in `tailwind.config.js`.
 * @constructor
 */
const ActionReferentielRecursiveCard = ({
  action,
  card,
}: {
  action: ActionReferentiel;
  card: ({action}: {action: ActionReferentiel}) => JSX.Element;
}) => {
  if (action.actions.length === 0) return <div> {card({action})}</div>;
  else
    return (
      <div>
        <div> {card({action})}</div>{' '}
        {action.actions.map(action => (
          <ActionReferentielRecursiveCard
            key={action.id}
            action={action}
            card={card}
          />
        ))}
      </div>
    );
};

export const ActionReferentielAvancementCard = ({
  displayProgressStat,
  displayAddFicheActionButton,
  action,
}: {
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
  action: ActionReferentiel;
}) => {
  const isLeaf = action.actions.length === 0;
  return (
    <article>
      <div className="flex flex-row">
        <div>
          <ActionReferentielDisplayTitle action={action} />
          <div className="flex flex-col">
            <div
              className="htmlContent"
              dangerouslySetInnerHTML={{
                __html: addTargetToContentAnchors(action.description ?? ''),
              }}
            />
            <ActionExemplesExpandPanel action={action} />
            <ActionCommentaire actionId={action.id} />{' '}
          </div>
        </div>

        <div className="flex flex-col w-1/5">
          <ActionProgressBar action={action} scoreBloc={scoreBloc} />
          {isLeaf && <ActionStatusDropdown actionId={action.id} />}
        </div>
      </div>
    </article>
  );
};

export const ActionReferentielAvancementRecursiveCard = ({
  action,
  displayProgressStat,
  displayAddFicheActionButton,
}: {
  action: ActionReferentiel;
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
}) =>
  ActionReferentielRecursiveCard({
    action,
    card: ({action}) =>
      ActionReferentielAvancementCard({
        action,
        displayProgressStat,
        displayAddFicheActionButton,
      }),
  });
