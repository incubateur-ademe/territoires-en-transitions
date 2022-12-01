import {ActionType} from 'types/action_referentiel';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionScore} from 'core-logic/hooks/scoreHooks';
import {ActionPhaseBadge} from './ActionPhaseBadge';

export interface PillParams {
  color: string;
  textColor: string;
  filled: boolean;
  height: number;
}

export const pillParams: Record<ActionType, PillParams> = {
  referentiel: {
    color: '#000091',
    textColor: '#000091',
    filled: false,
    height: 20,
  },
  axe: {
    color: '#000091',
    textColor: '#000091',
    filled: false,
    height: 20,
  },
  'sous-axe': {
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
export const ActionPotentiel = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const score = useActionScore(action.id);

  if (score === null) return null;

  const potentiel = Number(score.point_potentiel.toFixed(2));
  const text =
    potentiel && !isNaN(potentiel)
      ? `${potentiel.toLocaleString()} points`
      : '0 point';
  return <span className="font-normal whitespace-nowrap">({text})</span>;
};

export const ActionReferentielTitlePill = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  const pill = pillParams[action.type];
  return (
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
  );
};

export const ActionReferentielDisplayTitle = ({
  action,
}: {
  action: ActionDefinitionSummary;
}) => {
  return (
    <div className="flex flex-row align-middle items-center font-bold gap-2 mr-2">
      <ActionReferentielTitlePill action={action} />
      <div>
        <span className="fr-text--lg">{action.nom} </span>
        <ActionPotentiel action={action} />
        {action.type === 'sous-action' ? (
          <ActionPhaseBadge action={action} className="fr-ml-4w" />
        ) : null}
      </div>
    </div>
  );
};
