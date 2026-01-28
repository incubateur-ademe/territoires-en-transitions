import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Financeur } from '@tet/domain/plans';
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

const financeurRowFormSchema = z.object({
  financeurTagId: z.number({
    error: 'Le financeur est requis',
  }),
  montantTtc: z.number({
    error: 'Le montant de subvention obtenu est requis',
  }),
});

export type FinanceurRowFormValues = z.infer<typeof financeurRowFormSchema>;

export const useFinanceurForm = (
  initialFinanceur?: Financeur
): UseFormReturn<FinanceurRowFormValues> => {
  const form = useForm<FinanceurRowFormValues>({
    resolver: standardSchemaResolver(financeurRowFormSchema),
    defaultValues: {
      financeurTagId: initialFinanceur?.financeurTagId ?? undefined,
      montantTtc: initialFinanceur?.montantTtc ?? undefined,
    },
  });

  const [previousFinanceur, setPreviousFinanceur] = useState<
    Financeur | undefined
  >(initialFinanceur);
  if (
    initialFinanceur &&
    previousFinanceur?.financeurTagId !== initialFinanceur.financeurTagId
  ) {
    setPreviousFinanceur(initialFinanceur);
    form.reset({
      financeurTagId: initialFinanceur?.financeurTagId ?? undefined,
      montantTtc: initialFinanceur?.montantTtc ?? undefined,
    });
  }

  return form;
};
