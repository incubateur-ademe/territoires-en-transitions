import { Completion } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { FicheWithRelations } from '@/domain/plans';
import { Icon, Tooltip } from '@/ui';
import { cn } from '@/ui/utils/cn';

type FicheActionCompletionStatusProps = {
  completion?: Completion;
  className?: string;
};

// Mapping of backend fields to display labels
const DISPLAYED_LABELS: Partial<Record<keyof FicheWithRelations, string>> = {
  titre: 'titre',
  description: 'description',
  statut: 'statut',
  pilotes: 'pilote',
} as const;

const getFieldLabel = (field: keyof FicheWithRelations) => {
  return DISPLAYED_LABELS[field] || field;
};

export const FicheActionCompletionStatus = ({
  completion: completionRaw,
  className,
}: FicheActionCompletionStatusProps) => {
  if (!completionRaw) return null;

  const completion = orderFields(completionRaw);

  const Icon = completion.isCompleted ? (
    <IconWithText variant="completed" text="Complétée" />
  ) : (
    <IconWithText variant="incomplete" text="À compléter" />
  );

  return (
    <Tooltip label={<CompletionList completion={completion} />}>
      <div className={className}>{Icon}</div>
    </Tooltip>
  );
};

const IconWithText = ({
  variant,
  text,
  className,
}: {
  variant: 'completed' | 'incomplete' | 'field-completed' | 'field-incomplete';
  text: string;
  className?: string;
}) => {
  const iconConfig = {
    completed: { icon: 'progress-8-line', color: 'text-success-1' },
    incomplete: { icon: 'progress-1-line', color: 'text-warning-1' },
    'field-completed': {
      icon: 'checkbox-circle-line',
      color: 'text-success-1',
    },
    'field-incomplete': { icon: 'prohibited-2-line', color: 'text-warning-1' },
  };

  const { icon, color } = iconConfig[variant];

  return (
    <div className="flex items-center">
      <Icon icon={icon} size="sm" className={cn('mr-1 h-4 w-4', color)} />
      <span className={cn('pt-[0.7px] h-4 flex items-center', className)}>
        {text}
      </span>
    </div>
  );
};

const CompletionList = ({ completion }: { completion: Completion }) => {
  if (!completion.fields || completion.fields.length === 0) return null;

  return (
    <ul>
      {completion.fields.map(
        ({
          field,
          isCompleted,
        }: {
          field: keyof FicheWithRelations;
          isCompleted: boolean;
        }) => (
          <li key={field} className="ml-2">
            <IconWithText
              variant={isCompleted ? 'field-completed' : 'field-incomplete'}
              text={getFieldLabel(field)}
              className="capitalize"
            />
          </li>
        )
      )}
    </ul>
  );
};

const orderFields = (completion: Completion) => {
  const DISPLAY_ORDER = ['titre', 'description', 'statut', 'pilotes'];

  const orderedFields = DISPLAY_ORDER.map((field) =>
    completion.fields.find((f) => f.field === field)
  ).filter((field) => field !== undefined);

  return {
    ...completion,
    fields: orderedFields,
  };
};
