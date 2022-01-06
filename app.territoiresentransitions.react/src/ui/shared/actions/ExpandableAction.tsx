import {ActionReferentiel} from 'generated/models/action_referentiel';
import {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {
  ActionReferentielLinkCard,
  ActionProgressBar,
  ActionReferentielDisplayTitle,
} from 'ui/referentiels';
import {Chevron} from 'ui/shared/Chevron';
import {scoreBloc} from 'core-logic/observables/scoreBloc';

/**
 * An expandable action used for "axes" and "sous axes", shows Scores.
 *
 * Note: could be made recursive to simplify display on "axes" pages.
 */
export const ExpandableAction = ({action}: {action: ActionReferentiel}) => {
  const [opened, setOpened] = useState(false);
  return (
    <div className="mt-5">
      <LazyDetails
        summary={
          <div className="flex flex-row items-center justify-between mt-3">
            <div className="flex flex-row w-4/5">
              <ActionReferentielDisplayTitle action={action} />
              <Chevron direction={opened ? 'down' : 'left'} />
            </div>
            <div className="w-1/6">
              <ActionProgressBar action={action} scoreBloc={scoreBloc} />
            </div>
          </div>
        }
        onChange={setOpened}
      >
        {action.actions.map(action => (
          <ActionReferentielLinkCard key={action.id} action={action} />
        ))}
      </LazyDetails>
    </div>
  );
};
