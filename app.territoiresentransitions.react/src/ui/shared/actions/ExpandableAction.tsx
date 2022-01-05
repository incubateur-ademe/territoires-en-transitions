import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {
  ActionReferentielTitleCard,
  ActionProgressBar,
  ActionReferentielDisplayTitle,
} from 'ui/referentiels';
import {Chevron} from 'ui/shared/Chevron';
import {scoreBloc} from 'core-logic/observables/scoreBloc';

/**
 * An expandable action used for "axes" and "orientations, shows Scores.
 *
 * Note: could be made recursive to simplify display on "axes" pages.
 */
export const ExpandableAction = ({action}: {action: ActionReferentiel}) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="mt-2">
      <LazyDetails
        summary={
          <div className="flex flex-row items-center justify-between mt-3">
            <div className="flex flex-row">
              <ActionReferentielDisplayTitle action={action} />
              <Chevron direction={opened ? 'down' : 'left'} />
            </div>
            <ActionProgressBar action={action} scoreBloc={scoreBloc} />
          </div>
        }
        onChange={setOpened}
      >
        {action.actions.map(action => (
          <ActionReferentielTitleCard key={action.id} action={action} />
        ))}
      </LazyDetails>
    </div>
  );
};
