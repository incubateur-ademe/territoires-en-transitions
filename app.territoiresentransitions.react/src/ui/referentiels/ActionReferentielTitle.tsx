import type {
  ActionReferentiel,
  ActionType,
} from 'generated/models/action_referentiel';

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
  'sous-action': {
    color: '#000091',
    textColor: 'white',
    filled: false,
    height: 20,
  },
  'sous-domaine': {
    color: '#000091',
    textColor: 'white',
    filled: false,
    height: 20,
  },
  action: {color: '#000091', textColor: 'white', filled: true, height: 20},
  domaine: {color: '#919BAC', textColor: 'black', filled: false, height: 20},
  tache: {color: '#E8EBF3', textColor: 'black', filled: false, height: 20},
};

export const ActionReferentielDisplayTitle = ({
  action,
}: {
  action: ActionReferentiel;
}) => {
  const pill = pillParams[action.type];

  return (
    <div className="flex flex-row align-middle items-center font-bold">
      <div
        className="content-center mr-2"
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
    </div>
  );
};
