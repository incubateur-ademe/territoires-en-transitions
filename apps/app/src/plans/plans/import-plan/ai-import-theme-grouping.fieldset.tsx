import { appLabels } from '@/app/labels/catalog';
import { useId } from 'react';
import {
  QuestionConsequence,
  QuestionHeader,
  QuestionOption,
} from './ai-import-question-option';
import type { ChoiceOf, DoubtOf } from './ai-import-questions.model';

type ThemeGroupingDoubt = DoubtOf<'theme-grouping'>;
type ThemeGroup = ThemeGroupingDoubt['groups'][number];
type ThemeGrouping = ThemeGroupingDoubt['proposed'];

/** Le libellé de la synthèse, puis chaque thème des fiches qu'il réunit. */
const ThemeGroupCard = ({ group }: { group: ThemeGroup }) => (
  <div className="flex flex-col gap-3 rounded-lg border-2 border-grey-3 p-4">
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-grey-7">
        {appLabels.importPlanIaQuestionThemesSynthese({
          page: group.labelPage,
          count: group.variants.length,
        })}
      </span>
      <span className="font-bold text-grey-9">{group.label}</span>
    </div>
    <ul className="flex flex-col gap-2 m-0 pl-4 border-l-2 border-primary-3 list-none">
      {group.variants.map((variant) => (
        <li key={variant.theme} className="flex flex-col gap-0.5 p-0 min-w-0">
          <span className="font-bold text-grey-8">{variant.theme}</span>
          <span className="text-xs text-grey-7">
            {appLabels.importPlanIaQuestionThemesVariante({
              fiches: variant.fiches,
              page: variant.page,
            })}{' '}
            <span className="italic">{variant.exampleTitle}</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * Les thèmes écrits au-dessus des fiches qu'une page de synthèse réunit : un
 * axe par libellé de la synthèse, ou un axe par thème des fiches.
 */
export const ThemeGroupingFieldset = ({
  doubt,
  value,
  onChange,
  disabled,
}: {
  doubt: ThemeGroupingDoubt;
  value: ChoiceOf<'theme-grouping'>;
  onChange: (choice: ChoiceOf<'theme-grouping'>) => void;
  disabled: boolean;
}) => {
  const titleId = useId();
  const name = useId();
  const themes = doubt.groups.reduce(
    (count, { variants }) => count + variants.length,
    0
  );
  const axesOf: Record<ThemeGrouping, number> = {
    grouped: doubt.groups.length,
    separate: themes,
  };

  const option = (option: ThemeGrouping, label: string) => (
    <QuestionOption
      name={name}
      value={option}
      checked={value.grouping === option}
      onSelect={() => onChange({ kind: 'theme-grouping', grouping: option })}
      disabled={disabled}
      dataTest={`plans.import-ia.question.theme-grouping.${option}`}
      aside={
        <span className="text-sm font-bold text-grey-8">
          {appLabels.axe({ count: axesOf[option] })}
        </span>
      }
      proposedReason={
        doubt.proposed === option && option === 'grouped'
          ? appLabels.importPlanIaQuestionThemesRaisonRegrouper
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
        title={appLabels.importPlanIaQuestionThemesTitre}
        intro={appLabels.importPlanIaQuestionThemesIntro}
      />
      <div className="flex flex-col gap-3">
        {doubt.groups.map((group) => (
          <ThemeGroupCard key={group.label} group={group} />
        ))}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className="flex flex-col gap-3"
      >
        {option('grouped', appLabels.importPlanIaQuestionThemesRegrouper)}
        {option('separate', appLabels.importPlanIaQuestionThemesSeparer)}
      </div>
      <QuestionConsequence>
        {value.grouping === 'grouped'
          ? appLabels.importPlanIaQuestionThemesConsequenceRegrouper({
              themes,
              axes: doubt.groups.length,
            })
          : appLabels.importPlanIaQuestionThemesConsequenceSeparer({ themes })}
      </QuestionConsequence>
    </>
  );
};
