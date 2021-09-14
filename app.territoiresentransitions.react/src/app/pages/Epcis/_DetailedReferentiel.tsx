import {UiGaugeProgressStat, RootProgressStat} from 'ui/referentiels';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Spacer} from 'ui/shared';

import {DetailedEpciCardPropsLink} from './_DetailedEpciCardPropsLink';
import {displayName} from 'utils/actions';
import {Referentiel} from 'types';

const AxisSummary = (props: {
  title: string;
  epciId: string;
  score: ActionReferentielScoreStorable | null;
}) => (
  <div className="flex items-center justify-between text-xs">
    <div className="w-3/5">{props.title}</div>
    <div className="flex">
      <UiGaugeProgressStat score={props.score} />
      <DetailedEpciCardPropsLink
        label=""
        linkTo={`/collectivite/${props.epciId}/action/${props.score?.action_id}`} // TODO link to ECI ref
      />
    </div>
  </div>
);

export const DetailedReferentiel = ({
  title,
  scores,
  epciId,
  axes,
  referentiel,
}: {
  title: string;
  scores: ActionReferentielScoreStorable[];
  axes: ActionReferentiel[];
  epciId: string;
  referentiel: Referentiel;
}) => {
  const root_score =
    scores.find(score => score.action_nomenclature_id === '') || null;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">{title}</div>
        <RootProgressStat score={root_score} />
      </div>
      <Spacer size={3} />
      <div>
        {axes.map(axis => {
          const title = displayName(axis);

          return (
            <div className="my-1" key={axis.id}>
              <AxisSummary
                title={title}
                epciId={epciId}
                score={
                  scores.find(score => score.action_id === axis.id) || null
                }
              />
            </div>
          );
        })}
      </div>
      <Spacer size={2} />
      <DetailedEpciCardPropsLink
        label="Voir le référentiel"
        linkTo={`/collectivite/${epciId}/referentiels/${referentiel}`} // TODO link to ECI ref
      />
    </div>
  );
};
