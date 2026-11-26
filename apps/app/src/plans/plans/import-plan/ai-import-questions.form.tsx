import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactElement, useState } from 'react';
import { ActionLevelFieldset } from './ai-import-action-level.fieldset';
import { ActionsWithoutFicheFieldset } from './ai-import-actions-without-fiche.fieldset';
import {
  choicesToSend,
  proposedChoicesOf,
  type ImportChoice,
  type ImportChoices,
  type ImportDoubt,
} from './ai-import-questions.model';
import { ThemeGroupingFieldset } from './ai-import-theme-grouping.fieldset';

type FieldsetProps = {
  doubt: ImportDoubt;
  choices: ImportChoices;
  onChange: (choice: ImportChoice) => void;
  withSousActions: boolean;
  disabled: boolean;
};

/** Une question par sorte de doute : un nouveau doute ne compile pas sans elle. */
const renderFieldset = ({
  doubt,
  choices,
  onChange,
  withSousActions,
  disabled,
}: FieldsetProps): ReactElement => {
  switch (doubt.kind) {
    case 'action-level':
      return (
        <ActionLevelFieldset
          doubt={doubt}
          value={
            choices[doubt.kind] ?? {
              kind: doubt.kind,
              actionLevel: doubt.proposed,
            }
          }
          onChange={onChange}
          withSousActions={withSousActions}
          disabled={disabled}
        />
      );
    case 'theme-grouping':
      return (
        <ThemeGroupingFieldset
          doubt={doubt}
          value={
            choices[doubt.kind] ?? {
              kind: doubt.kind,
              grouping: doubt.proposed,
            }
          }
          onChange={onChange}
          disabled={disabled}
        />
      );
    case 'actions-without-fiche':
      return (
        <ActionsWithoutFicheFieldset
          doubt={doubt}
          value={
            choices[doubt.kind] ?? { kind: doubt.kind, actions: doubt.proposed }
          }
          onChange={onChange}
          disabled={disabled}
        />
      );
  }
};

/**
 * Les précisions demandées après la lecture, posées ensemble : une réponse
 * par question, la réponse proposée cochée, un seul envoi pour toutes.
 */
export const AiImportQuestionsForm = ({
  doubts,
  withSousActions,
  onSubmit,
  isAnswering = false,
}: {
  doubts: ImportDoubt[];
  /** Sans sous-actions, les étapes d'une fiche ne sont pas créées. */
  withSousActions: boolean;
  onSubmit: (choices: ImportChoice[]) => void;
  isAnswering?: boolean;
}) => {
  const [choices, setChoices] = useState<ImportChoices>(() =>
    proposedChoicesOf(doubts)
  );

  return (
    <div className="flex flex-col gap-6" data-test="plans.import-ia.question">
      <p className="mb-0 text-sm text-grey-7">
        {appLabels.importPlanIaQuestionDocumentLu({ count: doubts.length })}
      </p>

      {doubts.map((doubt, index) => (
        <div
          key={doubt.kind}
          className={cn(
            'flex flex-col gap-5',
            index > 0 && 'border-t border-grey-3 pt-6'
          )}
          data-test={`plans.import-ia.question.${doubt.kind}`}
        >
          {doubts.length > 1 && (
            <span className="text-xs font-bold uppercase text-grey-7">
              {appLabels.importPlanIaQuestionPosition({
                position: index + 1,
                total: doubts.length,
              })}
            </span>
          )}
          {renderFieldset({
            doubt,
            choices,
            onChange: (choice) =>
              setChoices((previous) => ({
                ...previous,
                [choice.kind]: choice,
              })),
            withSousActions,
            disabled: isAnswering,
          })}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={() => onSubmit(choicesToSend(doubts, choices))}
          loading={isAnswering}
          disabled={isAnswering}
          dataTest="plans.import-ia.question.continuer"
        >
          {appLabels.importPlanIaQuestionContinuer}
        </Button>
        <span className="text-sm text-grey-7">
          {appLabels.importPlanIaQuestionDelai}
        </span>
      </div>
    </div>
  );
};
