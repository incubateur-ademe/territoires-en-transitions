'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Modal, ModalFooterOKCancel } from '@tet/ui';
import { JSX, useEffect } from 'react';
import { FieldError, useForm, UseFormRegister } from 'react-hook-form';
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

const ReferenceYearField = ({
  register,
  error,
}: {
  register: UseFormRegister<ReferenceYearForm>;
  error?: FieldError;
}): JSX.Element => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between gap-3">
      <label
        htmlFor="reference-year-input"
        className="mb-0 text-sm font-medium text-primary-9"
      >
        {appLabels.indicateurNouvelleAnneeReferenceChamp}
      </label>
      <Input
        id="reference-year-input"
        type="text"
        inputMode="numeric"
        autoFocus
        aria-invalid={error !== undefined}
        aria-describedby="reference-year-error"
        displaySize="sm"
        className="w-24 text-right"
        {...register('year', { valueAsNumber: true })}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
    <p
      id="reference-year-error"
      role="alert"
      className="mb-0 min-h-[1.25rem] text-right text-xs text-error-1"
    >
      {error?.message ?? ''}
    </p>
  </div>
);

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
          <ReferenceYearField register={register} error={errors.year} />
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
