import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import {
  Budget,
  BudgetPerYear,
  budgetPerYearFormSchema,
  budgetSummarychema,
} from '../../../context/types';

export const useBudgetPerYearForm = (
  initialBudget?: Partial<BudgetPerYear>
): UseFormReturn<BudgetPerYear> => {
  const form = useForm<BudgetPerYear>({
    resolver: standardSchemaResolver(budgetPerYearFormSchema),
    defaultValues: {
      year: initialBudget?.year ?? undefined,
      montant: initialBudget?.montant ?? undefined,
      depense: initialBudget?.depense ?? undefined,
      etpPrevisionnel: initialBudget?.etpPrevisionnel ?? undefined,
      etpReel: initialBudget?.etpReel ?? undefined,
      htBudgetId: initialBudget?.htBudgetId ?? undefined,
      etpBudgetId: initialBudget?.etpBudgetId ?? undefined,
    },
  });

  useEffect(() => {
    form.reset(initialBudget);
  }, [initialBudget, form]);
  return form;
};

export const useBudgetSummaryForm = (
  initialBudget: Partial<Budget> | null
): UseFormReturn<Budget> => {
  const form = useForm<Budget>({
    resolver: standardSchemaResolver(budgetSummarychema),
    defaultValues: {
      montant: initialBudget?.montant ?? undefined,
      depense: initialBudget?.depense ?? undefined,
      etpPrevisionnel: initialBudget?.etpPrevisionnel ?? undefined,
      etpReel: initialBudget?.etpReel ?? undefined,
      htBudgetId: initialBudget?.htBudgetId ?? undefined,
      etpBudgetId: initialBudget?.etpBudgetId ?? undefined,
    },
  });
  useEffect(() => {
    form.reset(initialBudget ?? {});
  }, [initialBudget, form]);

  return form;
};
