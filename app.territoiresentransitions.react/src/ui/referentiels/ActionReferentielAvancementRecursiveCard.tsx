import {scoreBloc} from 'core-logic/observables/scoreBloc';
import {ActionStatusDropdown} from 'ui/shared/actions/ActionStatusDropdown';
import {ActionProgressBar} from 'ui/referentiels/ActionProgressBar';
import {ActionReferentielDisplayTitle} from 'ui/referentiels/ActionReferentielDisplayTitle';
import {ActionReferentielDescription} from 'ui/referentiels/ActionReferentielDescription';
import {Spacer} from 'ui/shared/Spacer';
import {
  ActionExemplesExpandPanel,
  ActionPreuvesExpandPanel,
} from 'ui/shared/actions/ActionExpandPanels';
import {ActionCommentaire} from 'ui/shared/actions/ActionCommentaire';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {PersoPotentiel} from 'app/pages/collectivite/PersoPotentielModal/PersoPotentiel';

/**
 * Displays an actions and it's children below.
 */
const ActionReferentielRecursiveCard = ({
  action,
  card,
}: {
  action: ActionDefinitionSummary;
  card: ({action}: {action: ActionDefinitionSummary}) => JSX.Element;
}) => {
  if (action.children.length === 0) return <div> {card({action})}</div>;

  const children = useActionSummaryChildren(action);
  return (
    <div id={action.id}>
      <div> {card({action})}</div>{' '}
      {children.map(action => (
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
  action,
}: {
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
  action: ActionDefinitionSummary;
}) => {
  const isLeaf = action.children.length === 0;
  return (
    <div className="pt-8 flex flex-row justify-between">
      <div className="flex flex-col w-4/5">
        <ActionReferentielDisplayTitle action={action} />
        <Spacer size={1} />
        <ActionReferentielDescription action={action} />
        {action.have_questions && <PersoPotentiel actionDef={action} />}
        {action.have_exemples && <ActionExemplesExpandPanel action={action} />}
        {action.have_preuve && <ActionPreuvesExpandPanel action={action} />}
        <ActionCommentaire action={action} />
      </div>
      <div className="w-2/8 pl-4">
        <div className="w-full flex flex-col">
          {!isLeaf && (
            <div className="pt-4">
              <ActionProgressBar actionId={action.id} scoreBloc={scoreBloc} />
            </div>
          )}
          {isLeaf && (
            <div
              className="pt-2 flex justify-end"
              data-test={`task-${action.id}`}
            >
              <ActionStatusDropdown actionId={action.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ActionReferentielAvancementRecursiveCard = ({
  action,
  displayProgressStat,
  displayAddFicheActionButton,
}: {
  action: ActionDefinitionSummary;
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
