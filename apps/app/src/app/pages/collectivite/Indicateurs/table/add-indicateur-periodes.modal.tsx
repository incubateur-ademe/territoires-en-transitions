import { getIndicateurPeriodPresentation } from '@/app/indicateurs/valeurs/indicateur-period-presentation';
import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IndicateurPeriods,
  type IndicateurPeriodicite,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';
import {
  Button,
  Field,
  FieldMessage,
  Input,
  Modal,
  ModalFooter,
  Select,
} from '@tet/ui';
import type { OpenState } from '@tet/ui/utils/types';
import { useId } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { parseIndicateurPeriodInput } from './add-indicateur-periodes.rules';

export const AddIndicateurPeriodesModal = ({
  periodicite,
  existingPeriods,
  openState,
  onAdd,
}: {
  periodicite: IndicateurPeriodicite;
  existingPeriods: IndicateurPeriod[];
  openState: OpenState;
  onAdd: (periods: IndicateurPeriod[]) => Promise<boolean>;
}) => {
  const id = useId();
  const { editor } = getIndicateurPeriodPresentation(periodicite);
  const existing = new Set(existingPeriods.map(IndicateurPeriods.key));
  const schema = z
    .object({
      periods: z
        .array(z.object({ year: z.string(), subdivision: z.string() }))
        .min(1),
    })
    .superRefine(({ periods }, context) => {
      const seen = new Set(existing);
      for (const [index, input] of periods.entries()) {
        try {
          const key = IndicateurPeriods.key(
            parseIndicateurPeriodInput(periodicite, input)
          );
          if (seen.has(key)) throw new Error('duplicate');
          seen.add(key);
        } catch {
          context.addIssue({
            code: 'custom',
            path: ['periods', index, 'year'],
            message: appLabels.indicateurPeriodesInvalides,
          });
        }
      }
    });
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { periods: [{ year: '', subdivision: '' }] },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'periods',
  });
  const submit = handleSubmit(async ({ periods }) => {
    if (
      await onAdd(
        periods.map((input) => parseIndicateurPeriodInput(periodicite, input))
      )
    ) {
      reset();
      openState.setIsOpen(false);
    }
  });
  const subdivisionLabel = {
    annuelle: appLabels.champAnnee,
    semestrielle: appLabels.indicateurSemestre,
    trimestrielle: appLabels.indicateurTrimestre,
    mensuelle: appLabels.indicateurMois,
  }[periodicite];
  return (
    <Modal
      openState={openState}
      size="lg"
      title={getIndicateurPeriodPresentation(periodicite).editor.addLabel}
      render={() => (
        <form id={id} onSubmit={submit} className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              {editor.subdivisionOptions.length > 0 && (
                <Field
                  title={subdivisionLabel}
                  htmlFor={`${id}-${index}-subdivision`}
                  className="w-44 !grow-0 shrink-0"
                >
                  <Controller
                    control={control}
                    name={`periods.${index}.subdivision`}
                    render={({ field }) => (
                      <Select
                        options={editor.subdivisionOptions}
                        values={field.value}
                        onChange={(value) => field.onChange(value ?? '')}
                        custom={{
                          triggerButton: {
                            button: (
                              <Button
                                id={`${id}-${index}-subdivision`}
                                type="button"
                                variant="outlined"
                                className="w-full justify-between"
                                icon="arrow-down-s-line"
                                iconPosition="right"
                                disabled={isSubmitting}
                              >
                                {editor.subdivisionOptions.find(
                                  (option) => option.value === field.value
                                )?.label ?? subdivisionLabel}
                              </Button>
                            ),
                          },
                        }}
                        placeholder={subdivisionLabel}
                        disabled={isSubmitting}
                        dataTest="indicateurs.periodes.subdivision"
                      />
                    )}
                  />
                </Field>
              )}
              <Field
                title={appLabels.champAnnee}
                htmlFor={`${id}-${index}-year`}
                className="grow"
                state={errors.periods?.[index]?.year ? 'error' : 'default'}
              >
                <Input
                  type="text"
                  id={`${id}-${index}-year`}
                  inputMode="numeric"
                  {...register(`periods.${index}.year`)}
                  disabled={isSubmitting}
                  data-test="indicateurs.periodes.year"
                />
                {errors.periods?.[index]?.year && (
                  <FieldMessage
                    state="error"
                    message={errors.periods[index].year.message}
                  />
                )}
              </Field>
              {fields.length > 1 && (
                <Button
                  type="button"
                  icon="close-line"
                  size="sm"
                  variant="white"
                  title={appLabels.indicateurSupprimerColonne}
                  onClick={() => remove(index)}
                  disabled={isSubmitting}
                  className="mt-7"
                />
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="underlined"
            size="sm"
            icon="add-line"
            onClick={() => append({ year: '', subdivision: '' })}
            disabled={isSubmitting}
          >
            {appLabels.indicateurAjouterColonne}
          </Button>
        </form>
      )}
      renderFooter={({ close }) => (
        <ModalFooter>
          <Button variant="outlined" onClick={close} disabled={isSubmitting}>
            {appLabels.annuler}
          </Button>
          <Button type="submit" form={id} disabled={isSubmitting}>
            {appLabels.ajouter}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
