import React, { createContext, useCallback, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BudgetPerYear } from '../../../../context/types';
import { useBudgetPerYearForm } from '../use-budget-form';

type BudgetPerYearFormContextValue = {
  form: UseFormReturn<BudgetPerYear>;
  isReadonly: boolean;
  onSubmit: () => Promise<void>;
};

const BudgetPerYearFormContext =
  createContext<BudgetPerYearFormContextValue | null>(null);

type BudgetPerYearFormProviderProps = {
  budget: BudgetPerYear;
  isReadonly: boolean;
  onUpsertBudget: (budget: BudgetPerYear) => Promise<void>;
  children: React.ReactNode;
};

export const BudgetPerYearFormProvider = ({
  budget,
  isReadonly,
  onUpsertBudget,
  children,
}: BudgetPerYearFormProviderProps) => {
  const form = useBudgetPerYearForm(budget);

  const onSubmit = useCallback(async () => {
    await form.handleSubmit(onUpsertBudget)();
  }, [form, onUpsertBudget]);

  return (
    <BudgetPerYearFormContext.Provider value={{ form, isReadonly, onSubmit }}>
      {children}
    </BudgetPerYearFormContext.Provider>
  );
};

export const useBudgetPerYearFormContext = () => {
  const context = useContext(BudgetPerYearFormContext);
  if (!context) {
    throw new Error(
      'useBudgetPerYearFormContext must be used within a BudgetPerYearFormProvider'
    );
  }
  return context;
};
