import { appLabels } from '@/app/labels/catalog';
import type { RouterOutput } from '@tet/api';
import { Button, RadioButton } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useId, useState } from 'react';
import { PlanLevel, PlanLevelTag } from './plan-level.tag';

type ImportQuestion = NonNullable<
  RouterOutput['plans']['aiImport']['getAiImportStatus']['question']
>;
export type ActionLevel = ImportQuestion['proposed'];
type DocumentLevel = ImportQuestion['fiches'];

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

/**
 * La seule question de l'import, posée quand le document laisse deux
 * lectures : la fiche ou chacune de ses étapes est-elle l'action ? Le choix
 * proposé est coché, l'étiquette de chaque niveau suit le choix.
 */
export const AiImportQuestion = ({
  question,
  onAnswer,
  isAnswering = false,
}: {
  question: ImportQuestion;
  onAnswer: (actionLevel: ActionLevel) => void;
  isAnswering?: boolean;
}) => {
  const [actionLevel, setActionLevel] = useState<ActionLevel>(
    question.proposed
  );
  const legendId = useId();
  const roles = rolesOf(actionLevel);
  const content =
    actionLevel === 'fiche'
      ? {
          axes: question.axes?.count ?? 0,
          sousAxes: 0,
          actions: question.fiches.count,
          sousActions: question.etapes.count,
        }
      : {
          axes: question.axes?.count ?? 0,
          sousAxes: question.fiches.count,
          actions: question.etapes.count,
          sousActions: 0,
        };

  const option = (value: ActionLevel, level: DocumentLevel, indent: string) => (
    <RadioButton
      name="niveau-action"
      value={value}
      checked={actionLevel === value}
      onChange={() => setActionLevel(value)}
      disabled={isAnswering}
      data-test={`plans.import-ia.question.${value}`}
      containerClassname={cn(
        'w-full rounded-lg border-2 p-4',
        indent,
        actionLevel === value
          ? 'border-primary-8 bg-primary-1'
          : 'border-grey-3 bg-white'
      )}
      labelClassname="w-full"
      label={
        <span className="flex flex-wrap items-center justify-between gap-3 w-full">
          <span className="flex flex-col gap-1 min-w-0">
            <DocumentLevelText level={level} />
            {question.proposed === value && (
              <span className="text-xs text-primary-9">
                <strong>{appLabels.importPlanIaQuestionChoixPropose}</strong>
                {' : '}
                {value === 'fiche'
                  ? appLabels.importPlanIaQuestionRaisonFiche
                  : appLabels.importPlanIaQuestionRaisonEtape}
              </span>
            )}
          </span>
          <Becomes level={roles[value]} />
        </span>
      }
    />
  );

  return (
    <div className="flex flex-col gap-5" data-test="plans.import-ia.question">
      <div className="flex flex-col gap-2">
        <p className="mb-0 text-sm text-grey-7">
          {appLabels.importPlanIaQuestionDocumentLu}
        </p>
        <h3 id={legendId} className="mb-0 text-xl text-primary-9">
          {appLabels.importPlanIaQuestionTitre}
        </h3>
        <p className="mb-0 text-grey-8">
          {appLabels.importPlanIaQuestionIntro}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {question.axes && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-grey-3 p-4">
            <DocumentLevelText level={question.axes} />
            <Becomes level="axe" />
          </div>
        )}
        <div
          role="radiogroup"
          aria-labelledby={legendId}
          className="flex flex-col gap-3"
        >
          {option('fiche', question.fiches, 'ml-5 w-[calc(100%-1.25rem)]')}
          {option('etape', question.etapes, 'ml-10 w-[calc(100%-2.5rem)]')}
        </div>
      </div>

      <p className="mb-0 font-bold text-primary-9" aria-live="polite">
        {actionLevel === 'fiche'
          ? appLabels.importPlanIaQuestionConsequenceFiche(content)
          : appLabels.importPlanIaQuestionConsequenceEtape(content)}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          onClick={() => onAnswer(actionLevel)}
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
