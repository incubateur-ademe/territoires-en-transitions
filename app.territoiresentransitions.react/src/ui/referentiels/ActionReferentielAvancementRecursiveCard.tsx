import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {ProgressStatStatic} from '.';
import {
  ActionDescriptionExpandPanel,
  ActionCommentaire,
  AddFicheActionButton,
  ActionStatusAvancementRadioButton,
  ActionExemplesExpandPanel,
  ActionPreuveExpandPanel,
} from 'ui/shared';
import {useEpciId} from 'core-logic/hooks';
import {ActionStatusStorable} from 'storables';
import {useActionStatus} from 'core-logic/hooks/actionStatus';

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
  marginLeft,
}: {
  action: ActionReferentiel;
  card: ({action}: {action: ActionReferentiel}) => JSX.Element;
  marginLeft?: number;
}) => {
  const ml = marginLeft ?? 0;
  if (action.actions.length === 0)
    return <div className={`ml-${ml}`}> {card({action})}</div>;
  else
    return (
      <div>
        <div className={`ml-${ml}`}> {card({action})}</div>{' '}
        {action.actions.map(action => (
          <ActionReferentielRecursiveCard
            key={action.id}
            action={action}
            card={card}
            marginLeft={ml + 20}
          />
        ))}
      </div>
    );
};

export const ActionReferentielAvancementCard = ({
  displayProgressStat,
  displayAddFicheActionButton,
  hideIfStatusRenseigne,
  action,
}: {
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
  hideIfStatusRenseigne: boolean;
  action: ActionReferentiel;
}) => {
  if (hideIfStatusRenseigne) {
    const epciId = useEpciId()!;
    const actionStatusStorableId = ActionStatusStorable.buildId(
      epciId,
      action.id
    );
    const actionStatus = useActionStatus(actionStatusStorableId);
    const actionStatusIsRenseigne =
      actionStatus && actionStatus.avancement !== '';
    if (actionStatusIsRenseigne) {
      return <></>;
    }
  }

  const isTache = action.actions.length === 0;
  return (
    <article
      className={` bg-beige my-8 p-4 border-bf500  ${
        isTache ? '' : 'border-l-4'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="w-4/5">
          <h3 className="text-lg font-normal">
            <span>{action.id_nomenclature} - </span>
            {action.nom}
          </h3>
        </div>
        <ProgressStatStatic
          action={action}
          position="right"
          className={`${displayProgressStat ? '' : 'hidden'}`}
          showPoints={true}
        />
      </div>
      <div className="flex justify-between my-6">
        {' '}
        <div className={` ${!displayAddFicheActionButton ? 'hidden' : ''}`}>
          <AddFicheActionButton actionId={action.id} />
        </div>
        <div className={` ${!isTache ? 'hidden' : ''}`}>
          <ActionStatusAvancementRadioButton actionId={action.id} />
        </div>
      </div>
      <div className="w-1/2">
        <ActionDescriptionExpandPanel action={action} />
        <ActionExemplesExpandPanel action={action} />
        <ActionCommentaire actionId={action.id} />{' '}
        <ActionPreuveExpandPanel action={action} />
      </div>
    </article>
  );
};

export const ActionReferentielAvancementRecursiveCard = ({
  action,
  displayProgressStat,
  displayAddFicheActionButton,
  hideIfStatusRenseigne,
}: {
  action: ActionReferentiel;
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
  hideIfStatusRenseigne: boolean;
}) =>
  ActionReferentielRecursiveCard({
    action,
    card: ({action}) =>
      ActionReferentielAvancementCard({
        action,
        displayProgressStat,
        displayAddFicheActionButton,
        hideIfStatusRenseigne,
      }),
  });
