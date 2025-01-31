import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { useActionScore } from '@/app/referentiels/DEPRECATED_score-hooks';
import { ActionType } from '@/domain/referentiels';
import { useScore, useSnapshotFlagEnabled } from '../use-snapshot';

interface PillParams {
  color: string;
  textColor: string;
  filled: boolean;
  height: number;
}

const pillParams: Record<ActionType, PillParams> = {
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
  action: { color: '#000091', textColor: 'white', filled: true, height: 20 },
  'sous-action': {
    color: '#919BAC',
    textColor: 'white',
    filled: true,
    height: 20,
  },
  tache: { color: '#E8EBF3', textColor: 'black', filled: true, height: 20 },
};

const ScorePotentiel = ({
  actionDefinition: actionDefinition,
}: {
  actionDefinition: ActionDefinitionSummary;
}) => {
  const DEPRECATED_score = useActionScore(actionDefinition.id);
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const NEW_score = useScore(actionDefinition.id);

  if (FLAG_isSnapshotEnabled) {
    if (NEW_score === undefined) return null;

    const potentiel = Number(NEW_score.pointPotentiel.toFixed(2));
    const text =
      potentiel && !isNaN(potentiel)
        ? `${potentiel.toLocaleString()} points`
        : '0 point';
    return <span className="font-normal whitespace-nowrap">({text})</span>;
  } else {
    if (DEPRECATED_score === null) return null;

    const potentiel = Number(DEPRECATED_score.point_potentiel.toFixed(2));
    const text =
      potentiel && !isNaN(potentiel)
        ? `${potentiel.toLocaleString()} points`
        : '0 point';
    return <span className="font-normal whitespace-nowrap">({text})</span>;
  }
};

const TitlePill = ({
  actionDefinition,
}: {
  actionDefinition: ActionDefinitionSummary;
}) => {
  const pill = pillParams[actionDefinition.type];
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
      <div className="pb-1">{actionDefinition.identifiant}</div>
    </div>
  );
};

export const ActionTitleWithScorePotentielHeader = ({
  actionDefinition,
}: {
  actionDefinition: ActionDefinitionSummary;
}) => {
  return (
    <div className="flex flex-row align-middle items-center font-bold gap-2 mr-2">
      <TitlePill actionDefinition={actionDefinition} />
      <div>
        <span className="fr-text--lg">{actionDefinition.nom} </span>
        <ScorePotentiel actionDefinition={actionDefinition} />
      </div>
    </div>
  );
};
