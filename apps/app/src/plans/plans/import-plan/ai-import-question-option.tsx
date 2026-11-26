import { appLabels } from '@/app/labels/catalog';
import { RadioButton } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode } from 'react';

/** Une réponse possible, en carte : cochée, elle passe en couleur. */
export const QuestionOption = ({
  name,
  value,
  checked,
  onSelect,
  disabled,
  dataTest,
  className,
  children,
  aside,
  proposedReason,
}: {
  /** Commun aux réponses d'une même question, unique dans la page. */
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  disabled: boolean;
  dataTest: string;
  className?: string;
  children: ReactNode;
  /** À droite de la carte : ce que devient le niveau, le nombre d'axes. */
  aside?: ReactNode;
  /** Présent sur la réponse proposée : pourquoi elle l'est. */
  proposedReason?: string;
}) => (
  <RadioButton
    name={name}
    value={value}
    checked={checked}
    onChange={onSelect}
    disabled={disabled}
    data-test={dataTest}
    containerClassname={cn(
      'w-full rounded-lg border-2 p-4',
      className,
      checked ? 'border-primary-8 bg-primary-1' : 'border-grey-3 bg-white'
    )}
    labelClassname="w-full"
    label={
      <span className="flex flex-wrap items-center justify-between gap-3 w-full">
        <span className="flex flex-col gap-1 min-w-0">
          {children}
          {proposedReason && (
            <span className="text-xs text-primary-9">
              <strong>{appLabels.importPlanIaQuestionChoixPropose}</strong>
              {' : '}
              {proposedReason}
            </span>
          )}
        </span>
        {aside}
      </span>
    }
  />
);

/** Le titre d'une question et ce qu'elle demande. */
export const QuestionHeader = ({
  titleId,
  title,
  intro,
}: {
  titleId: string;
  title: string;
  intro: string;
}) => (
  <div className="flex flex-col gap-2">
    <h3 id={titleId} className="mb-0 text-xl text-primary-9">
      {title}
    </h3>
    <p className="mb-0 text-grey-8">{intro}</p>
  </div>
);

/** Ce que donne la réponse cochée, relu à chaque changement. */
export const QuestionConsequence = ({ children }: { children: string }) => (
  <p className="mb-0 font-bold text-primary-9" aria-live="polite">
    {children}
  </p>
);
