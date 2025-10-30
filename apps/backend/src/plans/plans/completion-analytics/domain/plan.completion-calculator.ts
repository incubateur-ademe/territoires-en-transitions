import {
  CompletionField,
  CompletionFieldName,
  completionFields,
} from '../completion-analytics.dto';

export type CompletionPlanData = Record<
  CompletionFieldName,
  { completed: number }
>;

const calculatePercentage = (count: number, totalFiches: number) => {
  return totalFiches > 0 ? Math.round((count / totalFiches) * 100) : 0;
};

const PRIORITY_ORDER: CompletionFieldName[] = [
  'titre',
  'description',
  'statut',
  'pilotes',
  'objectifs',
  'indicateurs',
  'budgets',
  'suiviRecent',
];

const MIN_COMPLETION_PERCENTAGE = 80;

function sortByPriority(items: CompletionField[]): CompletionField[] {
  return [...items].sort((a, b) => {
    const indexA = PRIORITY_ORDER.indexOf(a.name);
    const indexB = PRIORITY_ORDER.indexOf(b.name);

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

export const getCompletion = (
  planData: CompletionPlanData,
  totalFiches: number
): CompletionField[] => {
  const completionData = completionFields
    .map((field: CompletionFieldName) => {
      const percentage = calculatePercentage(
        planData[field].completed,
        totalFiches
      );
      if (percentage >= MIN_COMPLETION_PERCENTAGE || totalFiches === 0) {
        return null;
      }
      return {
        name: field,
        count: totalFiches - planData[field].completed,
      };
    })
    .filter((item): item is CompletionField => item !== null);

  return sortByPriority(completionData);
};
