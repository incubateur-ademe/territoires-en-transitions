'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { JSX, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { appLabels } from '@/app/labels/catalog';
import { toYear, Year } from '../types';

const MIN_REFERENCE_YEAR = 2010;
const MAX_REFERENCE_YEAR = 2029;

const referenceYearMessage = appLabels.indicateurAnneeReferenceInvalide(
  MIN_REFERENCE_YEAR,
  MAX_REFERENCE_YEAR
);

const referenceYearSchema = z.object({
  year: z
    .number({ message: referenceYearMessage })
    .int(referenceYearMessage)
    .min(MIN_REFERENCE_YEAR, referenceYearMessage)
    .max(MAX_REFERENCE_YEAR, referenceYearMessage),
});
type ReferenceYearForm = z.infer<typeof referenceYearSchema>;

type ReferenceYearChangeModalProps = {
  isOpen: boolean;
  currentYear: Year;
  onConfirm: (year: Year) => void;
  onClose: () => void;
};

export const ReferenceYearChangeModal = ({
  isOpen,
  currentYear,
  onConfirm,
  onClose,
}: ReferenceYearChangeModalProps): JSX.Element => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReferenceYearForm>({
    resolver: zodResolver(referenceYearSchema),
    defaultValues: { year: currentYear },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) {
      reset({ year: currentYear });
    }
  }, [isOpen, currentYear, reset]);

  const submitReferenceYear = handleSubmit(({ year }) =>
    onConfirm(toYear(year))
  );

  return (
    <Modal
      size="xs"
      title={appLabels.indicateurChangerAnneeReferenceTitre}
      openState={{
        isOpen,
        setIsOpen: (open) => {
          if (!open) {
            onClose();
          }
        },
      }}
      render={() => (
        <form onSubmit={submitReferenceYear} className="flex flex-col gap-3">
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.indicateurChangerAnneeReferenceDescription}
          </p>
          <Field
            small
            state={errors.year ? 'error' : 'default'}
            message={errors.year?.message}
          >
            <Input
              type="text"
              inputMode="numeric"
              autoFocus
              aria-label={appLabels.indicateurAnneeReferenceChamp}
              displaySize="sm"
              className="w-24 text-right"
              {...register('year', { valueAsNumber: true })}
              onFocus={(event) => event.currentTarget.select()}
            />
          </Field>
        </form>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ children: appLabels.annuler, onClick: close }}
          btnOKProps={{
            children: appLabels.confirmer,
            onClick: () => submitReferenceYear(),
          }}
        />
      )}
    />
  );
};
