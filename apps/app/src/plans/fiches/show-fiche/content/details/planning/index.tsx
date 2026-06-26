import { appLabels } from '@/app/labels/catalog';
import {
  DateRangeInlineEditor,
  formatDateRange,
} from '@/app/ui/date-range/date-range.inline-editor';
import MiseEnOeuvreDropdown from '@/app/ui/dropdownLists/ficheAction/MiseEnOeuvreDropdown/MiseEnOeuvreDropdown';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { isFicheOnTime } from '@tet/domain/plans';
import { cn, Icon, InlineEditWrapper, Select } from '@tet/ui';
import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useFicheContext } from '../../../context/fiche-context';
import { InlineEditableItem } from '../editable-item';
import { planningFormSchema, PlanningFormValues } from './planning-schema';

const DateRangeWrapper = ({
  value,
  hasError,
}: {
  value: string | null;
  hasError?: boolean;
}) => {
  if (!value) {
    return (
      <span className="text-grey-7">{appLabels.placeholderARenseigner}</span>
    );
  }
  return (
    <span className={hasError ? 'text-error-3' : 'text-grey-8'}>{value}</span>
  );
};

export const Planning = () => {
  const { fiche, isReadonly, update } = useFicheContext();

  const { setToast } = useToastContext();

  const { control, watch, formState, handleSubmit, subscribe } =
    useForm<PlanningFormValues>({
      resolver: standardSchemaResolver(planningFormSchema),
      mode: 'onChange',
      defaultValues: {
        tempsDeMiseEnOeuvre: fiche.tempsDeMiseEnOeuvre,
        ameliorationContinue: fiche.ameliorationContinue ?? false,
      },
    });

  const ameliorationContinue = watch('ameliorationContinue');

  const handleSaveDates = useCallback(
    (values: { dateDebut: string | null; dateFin: string | null }) => {
      update({
        ficheId: fiche.id,
        ficheFields: values,
      });
    },
    [update, fiche.id]
  );

  const onSubmit = useCallback(
    async (
      formValues: PlanningFormValues,
      fieldName: keyof PlanningFormValues
    ) => {
      const currentValue = formValues[fieldName];
      await update({
        ficheId: fiche.id,
        ficheFields: { [fieldName]: currentValue },
      });
    },
    [update, fiche.id]
  );

  useEffect(() => {
    const subscription = watch((_formValues, { name }) => {
      if (!name) return;

      handleSubmit((data) =>
        onSubmit(data, name as keyof PlanningFormValues)
      )();
    });
    return () => subscription.unsubscribe();
  }, [watch, handleSubmit, onSubmit, formState.errors]);

  useEffect(() => {
    const callback = subscribe({
      formState: {
        errors: true,
      },
      callback: ({ errors }) => {
        if (errors && Object.keys(errors).length > 0) {
          setToast(
            'error',
            Object.values(errors ?? {})
              .map((error) => error.message)
              .join(', ')
          );
        }
      },
    });

    return () => callback();
  }, [subscribe, setToast]);

  const displayDateFin = ameliorationContinue === true ? null : fiche.dateFin;
  const formattedDateRange = formatDateRange(fiche.dateDebut, displayDateFin);
  const isDateFinLate = !isFicheOnTime({
    dateFin: displayDateFin,
    statut: fiche.statut,
  });

  return (
    <>
      <div className="text-sm leading-6 font-regular gap-4 mb-1 flex items-center">
        <div className="w-12 h-12 bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-8">
          <Icon icon="calendar-line" />
        </div>
        <div className="flex flex-col">
          <div className="text-primary-10 text-base">
            {appLabels.dateDebutFinPrevisionnelleLabel}
          </div>
          <InlineEditWrapper
            disabled={isReadonly}
            floatingMatchReferenceHeight={false}
            renderOnEdit={() => (
              <DateRangeInlineEditor
                dateDebut={fiche.dateDebut}
                dateFin={displayDateFin}
                onSave={handleSaveDates}
                dateFinDisabled={ameliorationContinue === true}
                dataTestPrefix="fiche-date"
              />
            )}
          >
            <span
              className={cn({
                'cursor-pointer hover:opacity-80 transition-opacity':
                  !isReadonly,
                'cursor-not-allowed opacity-50': isReadonly,
              })}
            >
              <DateRangeWrapper
                value={formattedDateRange}
                hasError={isDateFinLate}
              />
            </span>
          </InlineEditWrapper>
        </div>
      </div>
      <Controller
        name="tempsDeMiseEnOeuvre"
        control={control}
        render={({ field }) => (
          <InlineEditableItem
            icon="time-line"
            label={appLabels.tempsDeMiseEnOeuvre}
            value={field.value?.nom ?? undefined}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <MiseEnOeuvreDropdown
                inlineEdit
                openState={openState}
                values={field.value ?? null}
                onChange={(tempsDeMiseEnOeuvre) => {
                  field.onChange(tempsDeMiseEnOeuvre);
                }}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="ameliorationContinue"
        render={({ field }) => (
          <InlineEditableItem
            icon="loop-left-line"
            value={
              field.value
                ? appLabels.actionSeRepeteTousLesAns
                : appLabels.actionNeSeRepetePasTousLesAns
            }
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <Select
                options={[
                  {
                    value: 'true',
                    label: appLabels.actionSeRepeteTousLesAns,
                  },
                  {
                    value: 'false',
                    label: appLabels.actionNeSeRepetePasTousLesAns,
                  },
                ]}
                values={field.value ? 'true' : 'false'}
                onChange={(value) => {
                  const isChecked = value === 'true';
                  field.onChange(isChecked);
                  if (isChecked) {
                    update({
                      ficheId: fiche.id,
                      ficheFields: { dateFin: null },
                    });
                  }
                  openState.setIsOpen(false);
                }}
                inlineEdit
                openState={openState}
              />
            )}
          />
        )}
      />
    </>
  );
};
