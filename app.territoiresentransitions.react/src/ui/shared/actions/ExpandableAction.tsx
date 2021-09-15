import {ActionReferentiel} from 'generated/models/action_referentiel';
import React, {useState} from 'react';
import {LazyDetails} from 'ui/shared/LazyDetails';
import {
  ActionReferentielTitle,
  ActionReferentielTitleCard,
  CurrentEpciGaugeProgressStat,
  ProgressStatStatic,
} from 'ui/referentiels';
import {Chevron} from 'ui/shared/Chevron';

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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="px-3">
                <CurrentEpciGaugeProgressStat action={action} />
              </div>
              <div className="flex items-center mr-6">
                <ActionReferentielTitle
                  action={action}
                  className="fr-h6 mb-0"
                />
              </div>
              <Chevron direction={opened ? 'down' : 'left'} />
            </div>
          </div>
        }
        onChange={setOpened}
      >
        <div className=" ml-8 mb-6">
          {action.actions.map(action => (
            <ActionReferentielTitleCard
              key={action.id}
              action={action}
              referentiel="cae"
            />
          ))}
        </div>
      </LazyDetails>
    </div>
  );
};
