import {epciCard_AxisShortLabel} from 'app/labels';
import {UiGaugeProgressStat, RootProgressStat} from 'ui/referentiels';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {ActionReferentiel} from 'generated/models/action_referentiel';
import {Spacer} from 'ui/shared';

import {DetailedEpciCardPropsLink} from './_DetailedEpciCardPropsLink';

const AxisSummary = (props: {
  title: string;
  epciId: string;
  score: ActionReferentielScoreStorable | null;
}) => (
  <div className="flex items-center justify-between text-xs">
    <div className="w-1/2">{props.title}</div>
    <div className="flex">
      <UiGaugeProgressStat score={props.score} />
      <DetailedEpciCardPropsLink
        label=""
        linkTo={`/collectivite/${props.epciId}/referentiels`} // TODO link to ECI ref
      />
    </div>
  </div>
);

export const DetailedReferentiel = ({
  title,
  scores,
  epciId,
  axes,
}: {
  title: string;
  scores: ActionReferentielScoreStorable[];
  axes: ActionReferentiel[];
  epciId: string;
}) => {
  const root_score =
    scores.find(score => score.action_nomenclature_id === '') || null;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">{title}</div>
        <RootProgressStat state="good" score={root_score} />
      </div>
      <Spacer size={3} />
      {axes.map(axis => {
        // todo : use utils to format title
        const title =
          epciCard_AxisShortLabel[axis.id] ??
          `${axis.id_nomenclature} - ${axis.nom}`;

        return (
          <div className="my-1" key={axis.id}>
            <AxisSummary
              title={title}
              epciId={epciId}
              score={scores.find(score => score.action_id === axis.id) || null}
            />
          </div>
        );
      })}
      <DetailedEpciCardPropsLink
        label="Voir le référentiel"
        linkTo={`/collectivite/${epciId}/referentiels`} // TODO link to ECI ref
      />
    </div>
  );
};
