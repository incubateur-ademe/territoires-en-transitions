import { zodResolver } from '@hookform/resolvers/zod';
import { cn, Field, Icon, InlineEditWrapper, Input } from '@tet/ui';
import { ComponentProps, JSX } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { appLabels } from '@/app/labels/catalog';
import { toYear, Year } from '../types';

const MIN_REFERENCE_YEAR = 1900;
const MAX_REFERENCE_YEAR = 2100;
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

type ReferenceYearEditorProps = {
  year: Year;
  onReferenceYearChange: (year: Year) => void;
};

type ReferenceYearInputProps = {
  year: Year;
  onSubmit: (year: Year) => void;
  onCancel: () => void;
};

const ReferenceYearInput = ({
  year,
  onSubmit,
  onCancel,
}: ReferenceYearInputProps): JSX.Element => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReferenceYearForm>({
    resolver: zodResolver(referenceYearSchema),
    defaultValues: { year },
    mode: 'onChange',
  });

  return (
    <form
      className="w-24"
      onSubmit={handleSubmit(({ year: nextYear }) => onSubmit(toYear(nextYear)))}
    >
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
          className="text-right"
          {...register('year', { valueAsNumber: true })}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
        />
      </Field>
    </form>
  );
};

export const ReferenceYearEditor = ({
  year,
  onReferenceYearChange,
}: ReferenceYearEditorProps): JSX.Element => (
  <InlineEditWrapper
    renderOnEdit={({ openState }) => (
      <ReferenceYearInput
        year={year}
        onSubmit={(next) => {
          if (next !== year) {
            onReferenceYearChange(next);
          }
          openState.setIsOpen(false);
        }}
        onCancel={() => openState.setIsOpen(false)}
      />
    )}
  >
    {(triggerProps: ComponentProps<'button'>) => (
      <button
        type="button"
        {...triggerProps}
        aria-label={appLabels.indicateurModifierAnneeReference(year)}
        className={cn(
          triggerProps.className,
          'inline-flex items-center gap-1 font-bold text-primary-9'
        )}
      >
        <span className="underline decoration-dotted underline-offset-2">
          {appLabels.indicateurAnneeReference(year)}
        </span>
        <Icon icon="edit-line" size="xs" aria-hidden />
      </button>
    )}
  </InlineEditWrapper>
);
