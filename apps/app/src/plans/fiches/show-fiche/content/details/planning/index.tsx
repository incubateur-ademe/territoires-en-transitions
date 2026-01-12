import MiseEnOeuvreDropdown from '@/app/ui/dropdownLists/ficheAction/MiseEnOeuvreDropdown/MiseEnOeuvreDropdown';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { useBaseToast } from '@/app/utils/toast/use-base-toast';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { FicheWithRelations } from '@tet/domain/plans';
import type { TempsDeMiseEnOeuvre } from '@tet/domain/shared';
import { Checkbox, Input, TextareaBase } from '@tet/ui';
import { format } from 'date-fns';
import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useFicheContext } from '../../../context/fiche-context';
import { TemporaryEditableItem } from '../layout';
import { planningFormSchema, PlanningFormValues } from './planning-schema';

const TempsDeMiseEnOeuvre = ({
  tempsDeMiseEnOeuvre,
}: {
  tempsDeMiseEnOeuvre: FicheWithRelations['tempsDeMiseEnOeuvre'];
}) => {
  if (!tempsDeMiseEnOeuvre || tempsDeMiseEnOeuvre.nom === null) {
    return <span className="text-grey-7">À renseigner</span>;
  }
  return <span className="text-primary-10">{tempsDeMiseEnOeuvre.nom}</span>;
};

export const Planning = () => {
  const { fiche, isReadonly, update } = useFicheContext();

  const { renderToast, setToast } = useBaseToast();

  const { control, watch, formState, setValue, handleSubmit, subscribe } =
    useForm<PlanningFormValues>({
      resolver: standardSchemaResolver(planningFormSchema),
      mode: 'onChange',
      defaultValues: {
        dateDebut: fiche.dateDebut ? new Date(fiche.dateDebut ?? '') : null,
        dateFin: fiche.dateFin ? new Date(fiche.dateFin ?? '') : null,
        tempsDeMiseEnOeuvre: fiche.tempsDeMiseEnOeuvre,
        ameliorationContinue: fiche.ameliorationContinue ?? false,
        calendrier: fiche.calendrier,
      },
    });

  const onSubmit = useCallback(
    async (
      formValues: PlanningFormValues,
      fieldName: keyof PlanningFormValues
    ) => {
      const currentValue = formValues[fieldName as keyof PlanningFormValues];
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

  return (
    <>
      {renderToast()}

      <Controller
        control={control}
        name="dateDebut"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="calendar-line"
            label="Date de début et de fin prévisionnelle"
            value={
              field.value
                ? getTextFormattedDate({
                    date: format(field.value, 'yyyy-MM-dd'),
                  })
                : undefined
            }
            isReadonly={isReadonly}
            editComponent={(onBlur) => (
              <Input
                type="date"
                min="1900-01-01"
                max="2100-01-01"
                autoFocus
                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : null
                  );
                }}
                onBlur={onBlur}
              />
            )}
          />
        )}
      />
      <Controller
        control={control}
        name="dateFin"
        render={({ field, formState }) => (
          <TemporaryEditableItem
            icon="calendar-check-line"
            label="Date de fin"
            error={formState.errors.dateFin?.message}
            value={
              field.value
                ? getTextFormattedDate({
                    date: format(field.value, 'yyyy-MM-dd'),
                  })
                : undefined
            }
            isReadonly={isReadonly}
            editComponent={(onBlur) => (
              <Input
                type="date"
                min="1900-01-01"
                max="2100-01-01"
                autoFocus
                value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : null
                  );
                }}
                onBlur={onBlur}
              />
            )}
          />
        )}
      />
      <TemporaryEditableItem
        icon="time-line"
        label="Temps de mise en œuvre"
        value={
          <TempsDeMiseEnOeuvre
            tempsDeMiseEnOeuvre={watch('tempsDeMiseEnOeuvre')}
          />
        }
        isReadonly={isReadonly}
        editComponent={() => (
          <Controller
            name="tempsDeMiseEnOeuvre"
            control={control}
            render={({ field }) => (
              <div className="flex-1">
                <MiseEnOeuvreDropdown
                  values={field.value ?? null}
                  onChange={(tempsDeMiseEnOeuvre) =>
                    field.onChange(tempsDeMiseEnOeuvre)
                  }
                />
              </div>
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="ameliorationContinue"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="loop-left-line"
            label="L'action se répète tous les ans, sans date de fin prévisionnelle"
            value={field.value ? 'Oui' : 'Non'}
            isReadonly={isReadonly}
            editComponent={(onBlur) => {
              return (
                <Checkbox
                  checked={field.value ?? false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    if (isChecked) {
                      setValue('dateFin', null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                    field.onChange(isChecked);
                  }}
                  onBlur={() => {
                    onBlur();
                    field.onBlur();
                  }}
                />
              );
            }}
          />
        )}
      />
      <TemporaryEditableItem
        icon="time-line"
        label="Éléments de calendrier"
        value={fiche.calendrier}
        isReadonly={isReadonly}
        editComponent={(onBlur) => (
          <Controller
            name="calendrier"
            control={control}
            render={({ field }) => (
              <TextareaBase
                tabIndex={0}
                autoFocus
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value)}
                onBlur={onBlur}
              />
            )}
          />
        )}
      />
    </>
  );
};
