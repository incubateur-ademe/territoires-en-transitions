import MiseEnOeuvreDropdown from '@/app/ui/dropdownLists/ficheAction/MiseEnOeuvreDropdown/MiseEnOeuvreDropdown';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { useBaseToast } from '@/app/utils/toast/use-base-toast';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { isFicheOnTime } from '@tet/domain/plans';
import {
  cn,
  Icon,
  InlineEditWrapper,
  Input,
  Select,
  TextareaBase,
} from '@tet/ui';
import { format } from 'date-fns';
import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useFicheContext } from '../../../context/fiche-context';
import { InlineEditableItem } from '../editable-item';
import { planningFormSchema, PlanningFormValues } from './planning-schema';

const DisplayDateValue = ({
  value,
  hasError,
}: {
  value: string | undefined;
  hasError?: boolean;
}) => {
  if (!value) {
    return <span className="text-grey-7">À renseigner</span>;
  }
  return (
    <span className={hasError ? 'text-error-3' : 'text-grey-8'}>{value}</span>
  );
};

export const Planning = () => {
  const { fiche, isReadonly, update } = useFicheContext();

  const { renderToast, setToast } = useBaseToast();

  const { control, watch, formState, handleSubmit, subscribe, setValue } =
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

  const ameliorationContinue = watch('ameliorationContinue');

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
      <div className="text-sm leading-6 font-regular gap-4 mb-1 flex items-center">
        <div className="w-12 h-12 bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-8">
          <Icon icon="calendar-line" />
        </div>
        <div className="flex flex-col">
          <div className="text-primary-10 text-base">
            Date de début et de fin prévisionnelle
          </div>
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="dateDebut"
              render={({ field }) => (
                <InlineEditWrapper
                  disabled={isReadonly}
                  renderOnEdit={({ openState }) => (
                    <Input
                      type="date"
                      min="1900-01-01"
                      max="2100-01-01"
                      autoFocus
                      value={
                        field.value ? format(field.value, 'yyyy-MM-dd') : ''
                      }
                      onChange={(e) => {
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null
                        );
                      }}
                      onKeyDown={(evt) => {
                        if (evt.key === 'Enter' || evt.key === 'Escape') {
                          openState.setIsOpen(false);
                        }
                      }}
                    />
                  )}
                >
                  <span
                    className={cn({
                      'cursor-pointer hover:opacity-80 transition-opacity':
                        !isReadonly,
                    })}
                  >
                    <DisplayDateValue
                      value={
                        field.value
                          ? getTextFormattedDate({
                              date: format(field.value, 'yyyy-MM-dd'),
                            })
                          : undefined
                      }
                    />
                  </span>
                </InlineEditWrapper>
              )}
            />
            <Icon icon="arrow-right-line" className="text-grey-6" />
            <Controller
              control={control}
              name="dateFin"
              render={({ field, formState }) => {
                const isDateFinEditable = !isReadonly && !ameliorationContinue;
                return (
                  <InlineEditWrapper
                    disabled={!isDateFinEditable}
                    renderOnEdit={({ openState }) => (
                      <Input
                        type="date"
                        min="1900-01-01"
                        max="2100-01-01"
                        autoFocus
                        value={
                          field.value ? format(field.value, 'yyyy-MM-dd') : ''
                        }
                        onChange={(e) => {
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : null
                          );
                        }}
                        onBlur={() => openState.setIsOpen?.(false)}
                        onKeyDown={(evt) => {
                          if (evt.key === 'Enter' || evt.key === 'Escape') {
                            openState.setIsOpen(false);
                          }
                        }}
                      />
                    )}
                  >
                    <span
                      className={cn({
                        'cursor-pointer hover:opacity-80 transition-opacity':
                          isDateFinEditable,
                        'cursor-not-allowed opacity-50': !isDateFinEditable,
                      })}
                    >
                      <DisplayDateValue
                        value={
                          field.value
                            ? getTextFormattedDate({
                                date: format(field.value, 'yyyy-MM-dd'),
                              })
                            : undefined
                        }
                        hasError={
                          !!formState.errors.dateFin?.message ||
                          !isFicheOnTime({
                            dateFin: field.value
                              ? format(field.value, 'yyyy-MM-dd')
                              : null,
                            statut: fiche.statut,
                          })
                        }
                      />
                    </span>
                  </InlineEditWrapper>
                );
              }}
            />
          </div>
        </div>
      </div>
      <Controller
        name="tempsDeMiseEnOeuvre"
        control={control}
        render={({ field }) => (
          <InlineEditableItem
            icon="time-line"
            label="Temps de mise en œuvre"
            value={field.value?.nom ?? null}
            isReadonly={isReadonly}
            renderOnEdit={() => (
              <MiseEnOeuvreDropdown
                openState={{ isOpen: true }}
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
                ? "L'action se répète tous les ans, sans date de fin prévisionnelle"
                : "L'action ne se répète pas tous les ans"
            }
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <Select
                options={[
                  {
                    value: 'true',
                    label:
                      "L'action se répète tous les ans, sans date de fin prévisionnelle",
                  },
                  {
                    value: 'false',
                    label: "L'action ne se répète pas tous les ans",
                  },
                ]}
                values={field.value ? 'true' : 'false'}
                onChange={(value) => {
                  const isChecked = value === 'true';
                  field.onChange(isChecked);
                  // If amélioration continue is enabled, clear dateFin
                  if (isChecked) {
                    setValue('dateFin', null, {
                      shouldValidate: true,
                      shouldDirty: false,
                    });
                  }
                  openState.setIsOpen(false);
                }}
                buttonClassName="border-0 border-b"
                displayOptionsWithoutFloater
                openState={openState}
              />
            )}
          />
        )}
      />
      <Controller
        name="calendrier"
        control={control}
        render={({ field }) => (
          <InlineEditableItem
            icon="time-line"
            label="Éléments de calendrier"
            value={fiche.calendrier}
            isReadonly={isReadonly}
            renderOnEdit={() => (
              <TextareaBase
                tabIndex={0}
                autoFocus
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        )}
      />
    </>
  );
};
