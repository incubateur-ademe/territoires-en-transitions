import { appLabels } from '@/app/labels/catalog';
import { useId } from 'react';
import {
  QuestionConsequence,
  QuestionHeader,
  QuestionOption,
} from './ai-import-question-option';
import type { ChoiceOf, DoubtOf } from './ai-import-questions.model';

type ActionsWithoutFicheDoubt = DoubtOf<'actions-without-fiche'>;
type ActionsWithoutFiche = ActionsWithoutFicheDoubt['proposed'];

/**
 * Les actions qu'un tableau récapitulatif liste sans fiche qui les détaille :
 * toutes créées, avec leur seul titre, ou seulement celles qui ont une fiche.
 */
export const ActionsWithoutFicheFieldset = ({
  doubt,
  value,
  onChange,
  disabled,
}: {
  doubt: ActionsWithoutFicheDoubt;
  value: ChoiceOf<'actions-without-fiche'>;
  onChange: (choice: ChoiceOf<'actions-without-fiche'>) => void;
  disabled: boolean;
}) => {
  const titleId = useId();
  const name = useId();
  const { listed, withFiche, withoutFiche } = doubt;
  const actionsOf: Record<ActionsWithoutFiche, number> = {
    all: listed,
    'with-fiche': withFiche,
  };

  const option = (option: ActionsWithoutFiche, label: string) => (
    <QuestionOption
      name={name}
      value={option}
      checked={value.actions === option}
      onSelect={() =>
        onChange({ kind: 'actions-without-fiche', actions: option })
      }
      disabled={disabled}
      dataTest={`plans.import-ia.question.actions-without-fiche.${option}`}
      aside={
        <span className="text-sm font-bold text-grey-8">
          {appLabels.action({ count: actionsOf[option] })}
        </span>
      }
      proposedReason={
        doubt.proposed === option && option === 'all'
          ? appLabels.importPlanIaQuestionActionsSansFicheRaisonToutes
          : undefined
      }
    >
      <span className="font-bold text-grey-9">{label}</span>
    </QuestionOption>
  );

  return (
    <>
      <QuestionHeader
        titleId={titleId}
        title={appLabels.importPlanIaQuestionActionsSansFicheTitre}
        intro={appLabels.importPlanIaQuestionActionsSansFicheIntro({
          pages: doubt.tablePages,
          listed,
          withFiche,
        })}
      />
      <div className="flex flex-col gap-0.5 min-w-0 rounded-lg border-2 border-grey-3 p-4">
        <span className="text-xs text-grey-7">
          {appLabels.importPlanIaQuestionActionsSansFicheExemple({
            page: doubt.example.page,
          })}
        </span>
        <span className="font-bold text-grey-9">{doubt.example.title}</span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className="flex flex-col gap-3"
      >
        {option(
          'all',
          appLabels.importPlanIaQuestionActionsSansFicheToutes({ listed })
        )}
        {option(
          'with-fiche',
          appLabels.importPlanIaQuestionActionsSansFicheAvecFiche({
            withFiche,
          })
        )}
      </div>
      <QuestionConsequence>
        {value.actions === 'all'
          ? appLabels.importPlanIaQuestionActionsSansFicheConsequenceToutes({
              listed,
              withoutFiche,
            })
          : appLabels.importPlanIaQuestionActionsSansFicheConsequenceAvecFiche({
              withFiche,
              withoutFiche,
            })}
      </QuestionConsequence>
    </>
  );
};
