import {observer} from 'mobx-react-lite';
import {ActionReferentiel, ActionType} from 'generated/models';
import {scoreBloc, ScoreBloc} from 'core-logic/observables/scoreBloc';
import {referentielId} from 'utils/actions';
import {toFixed} from 'utils/toFixed';

export interface PillParams {
  color: string;
  textColor: string;
  filled: boolean;
  height: number;
}

export const pillParams: Record<ActionType, PillParams> = {
  domaine: {
    color: '#000091',
    textColor: '#000091',
    filled: false,
    height: 20,
  },
  'sous-domaine': {
    color: '#000091',
    textColor: '#000091',
    filled: false,
    height: 20,
  },
  action: {color: '#000091', textColor: 'white', filled: true, height: 20},
  'sous-action': {
    color: '#919BAC',
    textColor: 'white',
    filled: true,
    height: 20,
  },
  tache: {color: '#E8EBF3', textColor: 'black', filled: true, height: 20},
};
export const ActionPotentiel = observer(
  ({action, scoreBloc}: {action: ActionReferentiel; scoreBloc: ScoreBloc}) => {
    const score = scoreBloc.getScore(action.id, referentielId(action.id));

    if (score === null) return null;
    const potentiel = toFixed(score?.point_potentiel);
    const text = score?.point_potentiel ? `${potentiel} points` : '0 point';
    return <span className="font-normal">({text})</span>;
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
          borderWidth: 2,
          backgroundColor: pill.filled ? pill.color : 'white',
          borderColor: pill.filled ? 'white' : pill.color,
          borderRadius: pill.height,
          minHeight: pill.height,
          paddingLeft: pill.height * 0.5,
          paddingRight: pill.height * 0.5,
          fontSize: pill.height + 'px',
        }}
      >
        <div className="pb-1">{action.identifiant}</div>
      </div>
      <div>
        {action.nom} <ActionPotentiel action={action} scoreBloc={scoreBloc} />
      </div>
    </div>
  );
};
