import {
  Completion,
  CompletionField,
  FicheWithRelations,
} from '@tet/domain/plans';
import { Icon, Tooltip } from '@tet/ui';

type CompletionState = 'completed' | 'incomplete';

const ICONS: Record<'field' | 'overall', Record<CompletionState, string>> = {
  field: {
    completed: 'checkbox-circle-line',
    incomplete: 'prohibited-2-line',
  },
  overall: {
    completed: 'progress-8-line',
    incomplete: 'progress-1-line',
  },
};

const CompletionIcon = ({
  state,
  scope = 'overall',
}: {
  state: CompletionState;
  scope?: 'field' | 'overall';
}) => {
  const iconName = ICONS[scope][state];

  const iconColor = state === 'completed' ? 'text-success-1' : 'text-warning-1';

  return <Icon icon={iconName} className={`h-4 w-4 ${iconColor}`} size="sm" />;
};

const CompletionRow = ({
  state,
  scope,
  children,
}: {
  state: CompletionState;
  scope?: 'field' | 'overall';
  children: string;
}) => {
  return (
    <div className="flex items-center gap-1">
      <CompletionIcon state={state} scope={scope} />
      <span className="text-sm font-medium text-grey-8">{children}</span>
    </div>
  );
};

const orderFields = (fields?: Completion['fields']) => {
  if (!fields) return [];
  const orderedFields: Array<CompletionField> = [
    'titre',
    'description',
    'statut',
    'pilotes',
  ];
  return orderedFields
    .map((fieldKey) => fields.find(({ field }) => field === fieldKey))
    .filter(
      (item): item is NonNullable<(typeof fields)[number]> => item !== undefined
    );
};

const CompletionList = ({ completion }: { completion: Completion }) => {
  const orderedFields = orderFields(completion.fields);
  if (orderedFields.length === 0) return null;

  const FIELD_LABELS: Partial<Record<keyof FicheWithRelations, string>> = {
    titre: 'titre',
    description: 'description',
    statut: 'statut',
    pilotes: 'pilote',
  };

  return (
    <ul>
      {orderedFields.map(({ field, isCompleted }) => (
        <li key={field} className="ml-2">
          <CompletionRow
            scope="field"
            state={isCompleted ? 'completed' : 'incomplete'}
          >
            {FIELD_LABELS[field] || field}
          </CompletionRow>
        </li>
      ))}
    </ul>
  );
};

type CompletionStatusProps = {
  completion?: Completion;
  className?: string;
};

export const CompletionStatus = ({
  completion,
  className,
}: CompletionStatusProps) => {
  if (!completion) return null;

  const state: CompletionState = completion.isCompleted
    ? 'completed'
    : 'incomplete';

  const text = `Action  ${state === 'completed' ? 'complète' : 'incomplète'}`;
  return (
    <Tooltip label={<CompletionList completion={completion} />}>
      <div className={className}>
        <CompletionRow state={state}>{text}</CompletionRow>
      </div>
    </Tooltip>
  );
};
