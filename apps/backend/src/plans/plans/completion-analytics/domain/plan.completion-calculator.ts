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

export const ORDERED_FIELDS_TO_CHECK_FOR_COMPLETION: CompletionFieldName[] = [
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
  return ORDERED_FIELDS_TO_CHECK_FOR_COMPLETION.map((field) =>
    items.find((item) => item.name === field)
  ).filter((item): item is CompletionField => item !== undefined);
}

export const getCompletion = (
  planData: CompletionPlanData,
  {
    totalFiches,
    totalFichesOlderThanOneYear,
  }: {
    totalFiches: number;
    totalFichesOlderThanOneYear: number;
  }
): CompletionField[] => {
  const completionData = completionFields
    .map((field: CompletionFieldName) => {
      const totalFichesToCheck =
        field === 'suiviRecent' ? totalFichesOlderThanOneYear : totalFiches;

      const percentage = calculatePercentage(
        planData[field].completed,
        totalFichesToCheck
      );

      if (percentage >= MIN_COMPLETION_PERCENTAGE || totalFichesToCheck === 0) {
        return null;
      }
      return {
        name: field,
        count: totalFichesToCheck - planData[field].completed,
      };
    })
    .filter((item): item is CompletionField => item !== null);

  return sortByPriority(completionData);
};
