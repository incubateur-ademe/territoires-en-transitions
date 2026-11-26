import { appLabels } from '@/app/labels/catalog';
import { useId } from 'react';
import {
  QuestionConsequence,
  QuestionHeader,
  QuestionOption,
} from './ai-import-question-option';
import type { ChoiceOf, DoubtOf } from './ai-import-questions.model';
import { PlanLevel, PlanLevelTag } from './plan-level.tag';

type ActionLevelDoubt = DoubtOf<'action-level'>;
type ActionLevel = ActionLevelDoubt['proposed'];
type DocumentLevel = ActionLevelDoubt['fiches'];

/** Ce que devient chaque niveau de titres du document, selon le choix. */
const rolesOf = (
  actionLevel: ActionLevel
): { fiche: PlanLevel; etape: PlanLevel } =>
  actionLevel === 'fiche'
    ? { fiche: 'action', etape: 'sousAction' }
    : { fiche: 'sousAxe', etape: 'action' };

const DocumentLevelText = ({ level }: { level: DocumentLevel }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-xs text-grey-7">
      {appLabels.importPlanIaQuestionNiveauDocument({
        page: level.examplePage,
        count: level.count,
      })}
    </span>
    <span className="font-bold text-grey-9">{level.exampleTitle}</span>
  </div>
);

const Becomes = ({ level }: { level: PlanLevel }) => (
  <span className="flex items-center gap-2 text-sm text-grey-7">
    {appLabels.importPlanIaQuestionDevient}
    <PlanLevelTag level={level} />
  </span>
);

/** Les libellés qui changent quand les étapes sont les éléments d'une énumération. */
const wordingOf = (doubt: ActionLevelDoubt) =>
  doubt.etapesFrom === 'enumeration'
    ? {
        raisonEtape: appLabels.importPlanIaQuestionRaisonElement,
        consequenceFiche: appLabels.importPlanIaQuestionConsequenceMesure,
        consequenceEtape: appLabels.importPlanIaQuestionConsequenceElement,
      }
    : {
        raisonEtape: appLabels.importPlanIaQuestionRaisonEtape,
        consequenceFiche: appLabels.importPlanIaQuestionConsequenceFiche,
        consequenceEtape: appLabels.importPlanIaQuestionConsequenceEtape,
      };

/**
 * Le niveau de l'action, demandé quand le document laisse deux lectures :
 * la fiche ou chacune de ses étapes, la mesure ou chacun des éléments
 * qu'elle énumère. L'étiquette de chaque niveau suit le choix.
 */
export const ActionLevelFieldset = ({
  doubt,
  value,
  onChange,
  withSousActions,
  disabled,
}: {
  doubt: ActionLevelDoubt;
  value: ChoiceOf<'action-level'>;
  onChange: (choice: ChoiceOf<'action-level'>) => void;
  /** Sans sous-actions, les étapes d'une fiche ne sont pas créées. */
  withSousActions: boolean;
  disabled: boolean;
}) => {
  const titleId = useId();
  const name = useId();
  const { actionLevel } = value;
  const roles = rolesOf(actionLevel);
  const wording = wordingOf(doubt);
  const axes = doubt.axes?.count ?? 0;
  const content =
    actionLevel === 'fiche'
      ? {
          axes,
          sousAxes: 0,
          actions: doubt.fiches.count,
          sousActions: withSousActions ? doubt.etapes.count : 0,
        }
      : {
          axes,
          // Une fiche sans étape reste une action.
          sousAxes: doubt.fichesWithEtapes,
          actions:
            doubt.etapes.count + doubt.fiches.count - doubt.fichesWithEtapes,
          sousActions: 0,
        };

  const option = (
    option: ActionLevel,
    level: DocumentLevel,
    indent: string
  ) => (
    <QuestionOption
      name={name}
      value={option}
      checked={actionLevel === option}
      onSelect={() => onChange({ kind: 'action-level', actionLevel: option })}
      disabled={disabled}
      dataTest={`plans.import-ia.question.action-level.${option}`}
      className={indent}
      aside={<Becomes level={roles[option]} />}
      proposedReason={
        doubt.proposed !== option
          ? undefined
          : option === 'fiche'
          ? appLabels.importPlanIaQuestionRaisonFiche
          : wording.raisonEtape
      }
    >
      <DocumentLevelText level={level} />
    </QuestionOption>
  );

  return (
    <>
      <QuestionHeader
        titleId={titleId}
        title={appLabels.importPlanIaQuestionTitre}
        intro={appLabels.importPlanIaQuestionIntro}
      />
      <div className="flex flex-col gap-3">
        {doubt.axes && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-grey-3 p-4">
            <DocumentLevelText level={doubt.axes} />
            <Becomes level="axe" />
          </div>
        )}
        <div
          role="radiogroup"
          aria-labelledby={titleId}
          className="flex flex-col gap-3"
        >
          {option('fiche', doubt.fiches, 'ml-5 w-[calc(100%-1.25rem)]')}
          {option('etape', doubt.etapes, 'ml-10 w-[calc(100%-2.5rem)]')}
        </div>
      </div>
      <QuestionConsequence>
        {actionLevel === 'fiche'
          ? wording.consequenceFiche(content)
          : wording.consequenceEtape(content)}
      </QuestionConsequence>
    </>
  );
};
