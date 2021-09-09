import type {ActionReferentiel} from 'generated/models/action_referentiel';
import {ProgressStatStatic} from '.';
import {
  ActionDescriptionExpandPanel,
  ActionCommentaire,
  AddFicheActionButton,
  ActionStatusAvancementRadioButton,
  ActionExemplesExpandPanel,
} from 'ui/shared';

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
  action,
}: {
  displayProgressStat: boolean;
  displayAddFicheActionButton: boolean;
  action: ActionReferentiel;
}) => {
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
