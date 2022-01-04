import {scoreBloc, ScoreBloc} from 'core-logic/observables/scoreBloc';
import type {
  ActionReferentiel,
  ActionType,
} from 'generated/models/action_referentiel';
import {observer} from 'mobx-react-lite';
import {referentielId} from 'utils/actions';
import {toFixed} from 'utils/toFixed';

/**
 * @deprecated since new UI, use ActionReferentielDisplayTitle
 */
export const ActionReferentielTitle = ({
  action,
  className,
}: {
  action: ActionReferentiel;
  className?: string;
}) => (
  <span className={className ? className : 'text-lg h-8'}>
    {action.identifiant} - {action.nom}
  </span>
);

interface PillParams {
  color: string;
  textColor: string;
  filled: boolean;
  height: number;
}

const pillParams: Record<ActionType, PillParams> = {
  domaine: {
    color: '#000091',
    textColor: 'white',
    filled: false,
    height: 20,
  },
  'sous-domaine': {
    color: '#000091',
    textColor: 'white',
    filled: true,
    height: 20,
  },
  action: {color: '#000091', textColor: 'white', filled: true, height: 20},
  'sous-action': {
    color: '#919BAC',
    textColor: 'white',
    filled: true,
    height: 20,
  },
  tache: {color: '#E8EBF3', textColor: 'black', filled: false, height: 20},
};

const ActionPotentiel = observer(
  ({action, scoreBloc}: {action: ActionReferentiel; scoreBloc: ScoreBloc}) => {
    const score = scoreBloc.getScore(action.id, referentielId(action.id));

    if (score === null) return null;
    const potentiel = toFixed(score?.point_potentiel);
    return <div className="font-normal">({potentiel} points)</div>;
  }
);

export const ActionReferentielDisplayTitle = ({
  action,
}: {
  action: ActionReferentiel;
}) => {
  const pill = pillParams[action.type];

  return (
    <div className="flex flex-row align-middle items-center font-bold gap-2">
      <div
        className="content-center font-normal"
        style={{
          color: pill.textColor,
          backgroundColor: pill.filled ? pill.color : 'white',
          borderRadius: pill.height,
          minHeight: pill.height,
          paddingLeft: pill.height * 0.5,
          paddingRight: pill.height * 0.5,
          fontSize: pill.height + 'px',
        }}
      >
        {action.identifiant}
      </div>
      <div>{action.nom}</div>
      <ActionPotentiel action={action} scoreBloc={scoreBloc} />
    </div>
  );
};
