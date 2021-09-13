import type {EpciStorable} from 'storables/EpciStorable';
import {Link} from 'react-router-dom';
import {caeAxes, eciAxes} from 'utils/referentiels';
import {epciCard_AxisShortLabel} from 'app/labels';
import {UiGaugeProgressStat, RootProgressStat} from 'ui/referentiels';
import {useEpciAxisActionReferentielScores} from 'core-logic/hooks';
import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';
import {ActionReferentiel} from 'generated/models/action_referentiel';

const DetailedEpciCardPropsLink = (props: {label: string; linkTo: string}) => (
  <Link to={props.linkTo}>
    <div className="flex flex-wrap text-sm text-bf500">
      {props.label}
      <div className="fr-fi-arrow-right-line fr-btn--icon-left pl-4"> </div>
    </div>
  </Link>
);

const DetailedPlanActions = ({epci}: {epci: EpciStorable}) => (
  <div>
    {' '}
    <div>Plan d'actions</div>{' '}
    <DetailedEpciCardPropsLink
      label="Voir"
      linkTo={`/collectivite/${epci.id}/plan_actions`} // TODO link to specific plan d'action
    />
  </div>
);

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

const DetailedReferentiel = ({
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
  // const scores = useEpciAxisActionReferentielScores({
  //   epciId: epci.id,
  //   referentiel: 'eci',
  // });
  const root_score =
    scores.find(score => score.action_nomenclature_id === '') || null;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold">{title}</div>
        <RootProgressStat state="good" score={root_score} />
      </div>
      {axes.map(axis => {
        // todo 1 : use utils to format title
        // todo 2 : change md instead of using labels
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

const DetailedEpciCard = ({epci}: {epci: EpciStorable}) => {
  const caeScores = useEpciAxisActionReferentielScores({
    epciId: epci.id,
    referentiel: 'cae',
  });
  const eciScores = useEpciAxisActionReferentielScores({
    epciId: epci.id,
    referentiel: 'eci',
  });

  return (
    <div className="flex flex-col items-center justify- p-8 bg-beige">
      <div className="flex items-center w-full space-evenly">
        <div></div>
        <div>
          <h3 className="fr-h3 p-2 text-center ">{epci.nom}</h3>
        </div>
        <div>
          {' '}
          <DetailedEpciCardPropsLink
            label="Voir les indicateurs"
            linkTo={`/collectivite/${epci.id}/indicateurs`}
          />
        </div>
      </div>
      {/* <div className="flex items-center w-full justify-evenly"> */}
      <div className="grid grid-cols-3 gap-12">
        <div>
          <DetailedPlanActions epci={epci} />
        </div>
        <div>
          <DetailedReferentiel
            epciId={epci.id}
            scores={eciScores}
            axes={eciAxes}
            title="Économie Circulaire"
          />
        </div>
        <div>
          <DetailedReferentiel
            epciId={epci.id}
            scores={caeScores}
            axes={caeAxes}
            title="Climat Air Énergie"
          />
        </div>
      </div>
    </div>
  );
};

export const OwnedEpciCard = ({epci}: {epci: EpciStorable}) => {
  return (
    <div className="py-2">
      <DetailedEpciCard epci={epci} />
    </div>
  );
};
