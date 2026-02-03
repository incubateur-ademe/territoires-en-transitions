import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Financeur } from '@tet/domain/plans';
import React, { createContext, useCallback, useContext } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import {
  DraftFinanceurRowFormValues,
  financeurRowFormSchema,
  FinanceurRowFormValues,
} from './types';

type FinanceurFormContextValue = {
  form: UseFormReturn<FinanceurRowFormValues>;
  isReadonly: boolean;
  onSubmit: () => Promise<void>;
  onCancel?: () => void;
};

const FinanceurFormContext = createContext<FinanceurFormContextValue | null>(
  null
);
type FinanceurFormProviderProps = {
  financeur: Financeur | DraftFinanceurRowFormValues;
  isReadonly: boolean;
  onUpsertFinanceur: (financeur: FinanceurRowFormValues) => Promise<void>;
  onCancel?: () => void;
  onDraftFinanceurChange: (financeur: DraftFinanceurRowFormValues) => void;
  children: React.ReactNode;
  onDeleteDraftFinanceur: (draftId: string) => void;
};

export const FinanceurFormProvider = ({
  financeur,
  isReadonly,
  onUpsertFinanceur,
  onCancel,
  onDraftFinanceurChange,
  onDeleteDraftFinanceur,
  children,
}: FinanceurFormProviderProps) => {
  const form = useForm<FinanceurRowFormValues>({
    resolver: standardSchemaResolver(financeurRowFormSchema),
    mode: 'onChange',
    defaultValues: {
      ficheId: financeur.ficheId,
      financeurTagId: financeur.financeurTagId ?? undefined,
      montantTtc: financeur.montantTtc ?? undefined,
      draftId: 'draftId' in financeur ? financeur.draftId : undefined,
    },
  });

  const syncDraft = useCallback(
    (values?: FinanceurRowFormValues) => {
      const draftValues = values ?? form.getValues();
      if (!draftValues?.draftId) return;
      onDraftFinanceurChange({
        ...draftValues,
        ficheId: financeur.ficheId,
        draftId: draftValues.draftId,
      });
    },
    [form, onDraftFinanceurChange, financeur.ficheId]
  );

  const onSubmit = useCallback(async () => {
    syncDraft();
    await form.handleSubmit(async (data) => {
      await onUpsertFinanceur(data);
      if (data.draftId) {
        onDeleteDraftFinanceur(data.draftId);
      }
    })();
  }, [form, onUpsertFinanceur, onDeleteDraftFinanceur, syncDraft]);

  const value = React.useMemo(
    () => ({
      form,
      isReadonly,
      onSubmit,
      onCancel,
    }),
    [form, isReadonly, onSubmit, onCancel]
  );

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
