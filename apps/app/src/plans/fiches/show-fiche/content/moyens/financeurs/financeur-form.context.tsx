import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Financeur } from '@tet/domain/plans';
import React, { createContext, useCallback, useContext } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import {
  financeurRowFormSchema,
  FinanceurRowFormValues,
  TemporaryFinanceurRowFormValues,
} from './types';

type FinanceurFormContextValue = {
  form: UseFormReturn<FinanceurRowFormValues>;
  isReadonly: boolean;
  isTemporary: boolean;
  onSubmit: () => Promise<void>;
  onCancel?: () => void;
};

const FinanceurFormContext = createContext<FinanceurFormContextValue | null>(
  null
);
type FinanceurFormProviderProps = {
  financeur: Financeur | TemporaryFinanceurRowFormValues;
  isReadonly: boolean;
  onUpsertFinanceur: (financeur: FinanceurRowFormValues) => Promise<void>;
  onCancel?: () => void;
  children: React.ReactNode;
};

export const FinanceurFormProvider = ({
  financeur,
  isReadonly,
  onUpsertFinanceur,
  onCancel,
  children,
}: FinanceurFormProviderProps) => {
  const isTemporary = 'tempId' in financeur && financeur.tempId !== undefined;

  const form = useForm<FinanceurRowFormValues>({
    resolver: standardSchemaResolver(financeurRowFormSchema),
    mode: 'onChange',
    defaultValues: {
      financeurTagId: financeur.financeurTagId ?? undefined,
      montantTtc: financeur.montantTtc ?? undefined,
      tempId: 'tempId' in financeur ? financeur.tempId : undefined,
    },
  });

  const onSubmit = useCallback(async () => {
    await form.handleSubmit(async (data) => {
      await onUpsertFinanceur({
        tempId: 'tempId' in data ? data.tempId : undefined,
        financeurTagId: data.financeurTagId,
        montantTtc: data.montantTtc,
      });
    })();
  }, [form, onUpsertFinanceur]);

  const value = {
    form,
    isReadonly,
    isTemporary,
    onSubmit,
    onCancel,
  };
  return (
    <FinanceurFormContext.Provider value={value}>
      {children}
    </FinanceurFormContext.Provider>
  );
};

export const useFinanceurFormContext = () => {
  const context = useContext(FinanceurFormContext);
  if (!context) {
    throw new Error(
      'useFinanceurFormContext must be used within a FinanceurFormProvider'
    );
  }
  return context;
};
