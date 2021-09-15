import {UiGaugeProgressStat, RootProgressStat} from 'ui/referentiels';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {ActionReferentiel} from 'generated/models/action_referentiel';

import {DetailedEpciCardPropsLink} from './_DetailedEpciCardPropsLink';
import {displayName} from 'utils/actions';
import {Referentiel} from 'types';
import {epciCard_AxisShortLabel} from 'app/labels';

const AxisSummary = (props: {
  title: string;
  epciId: string;
  score: ActionReferentielScoreStorable | null;
  referentiel: Referentiel;
}) => (
  <div className="flex items-center justify-between text-xs">
    <div className="w-3/5">{props.title}</div>
    <div className="flex">
      <UiGaugeProgressStat score={props.score} size="xs" />
      <DetailedEpciCardPropsLink
        label=""
        linkTo={`/collectivite/${props.epciId}/action/${props.referentiel}/${props.score?.action_id}`} // TODO link to ECI ref
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
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">{title}</div>
          <RootProgressStat score={root_score} />
        </div>
        <div className="flex flex-col justify-evenly py-4 space-y-3">
          {axes.map(axis => {
            const axisShortName = epciCard_AxisShortLabel[axis.id] ?? axis.nom;
            const title = `${axis.id_nomenclature} - ${axisShortName}`;

            return (
              <div className="my-1" key={axis.id}>
                <AxisSummary
                  title={title}
                  epciId={epciId}
                  score={
                    scores.find(score => score.action_id === axis.id) || null
                  }
                  referentiel={referentiel}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col items-center py-4">
        <DetailedEpciCardPropsLink
          label="Voir le référentiel"
          linkTo={`/collectivite/${epciId}/referentiel/${referentiel}`} // TODO link to ECI ref
        />
      </div>
    </div>
  );
};
