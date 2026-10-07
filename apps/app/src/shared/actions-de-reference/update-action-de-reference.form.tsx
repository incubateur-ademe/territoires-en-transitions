import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import type { CloseRequestOutcome } from '@/app/ui/layout/side-panel/side-panel.contract';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  actionDeReferenceSchema,
  type CategorieAction,
  categorieActionEnumValues,
  LEVIER_NOM_BY_ID,
  type LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import { Button, Field, Input, type Option, Select, Textarea } from '@tet/ui';
import { type JSX, useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import * as z from 'zod/mini';
import type { UpdateActionDeReferenceFormComponent } from './actions-de-reference.contract';
import { useUpdateActionDeReference } from './data/use-update-action-de-reference';
import { DiscardChangesConfirmModal } from './discard-changes-confirm.modal';

const actionDeReferenceFieldsSchema = z.omit(actionDeReferenceSchema, {
  id: true,
});

type ActionDeReferenceFields = z.infer<typeof actionDeReferenceFieldsSchema>;

const toFieldErrorMessage: z.core.$ZodErrorMap = (issue) =>
  match(issue)
    .with({ code: 'too_small' }, () => appLabels.champObligatoireErreur)
    .with({ code: 'too_big' }, ({ maximum }) =>
      appLabels.champTropLongErreur(maximum)
    )
    .otherwise(() => appLabels.champValeurInvalideErreur);

type ChoiceOption<Value extends string> = Readonly<Pick<Option, 'label'>> & {
  readonly value: Value;
};

const levierOptions: readonly ChoiceOption<LevierId>[] = levierIdEnumValues.map(
  (levierId) => ({
    value: levierId,
    label: LEVIER_NOM_BY_ID[levierId],
  })
);

const categorieOptions: readonly ChoiceOption<CategorieAction>[] =
  categorieActionEnumValues.map((categorie) => ({
    value: categorie,
    label: appLabels.categorieActionLabel(categorie),
  }));

type SingleChoiceFieldProps<Value extends string> = {
  readonly title: string;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
};

const SingleChoiceField = <Value extends string>({
  title,
  options,
  value,
  onChange,
}: SingleChoiceFieldProps<Value>): JSX.Element => (
  <Field title={title}>
    <Select
      options={[...options]}
      values={value}
      onChange={(chosenValue) => {
        const chosenOption = options.find(
          (option) => option.value === chosenValue
        );
        const isUnknownChoice = chosenOption === undefined;
        if (isUnknownChoice) {
          return;
        }
        onChange(chosenOption.value);
      }}
    />
  </Field>
);

type DiscardChangesGuard = {
  readonly isDiscardConfirmationOpen: boolean;
  readonly discardChanges: () => void;
  readonly keepEditing: () => void;
};

const useDiscardChangesGuard = (
  hasUnsavedChanges: boolean
): DiscardChangesGuard => {
  const [isDiscardConfirmationOpen, setIsDiscardConfirmationOpen] =
    useState(false);

  const answerCloseRequest = useCallback((): CloseRequestOutcome => {
    if (!hasUnsavedChanges) {
      return 'close';
    }
    setIsDiscardConfirmationOpen(true);
    return 'stay-open';
  }, [hasUnsavedChanges]);

  const { setPanel } = useSidePanel({ onCloseRequest: answerCloseRequest });

  return {
    isDiscardConfirmationOpen,
    discardChanges: () => setPanel({ type: 'close' }),
    keepEditing: () => setIsDiscardConfirmationOpen(false),
  };
};

const UpdateActionDeReferenceForm: UpdateActionDeReferenceFormComponent = ({
  action,
  onUpdated,
}) => {
  const { updateAction, isPending } = useUpdateActionDeReference();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<ActionDeReferenceFields>({
    resolver: zodResolver(actionDeReferenceFieldsSchema, {
      error: toFieldErrorMessage,
    }),
    mode: 'onChange',
    defaultValues: {
      titre: action.titre,
      description: action.description,
      levier: action.levier,
      categorie: action.categorie,
    },
  });

  const { isDiscardConfirmationOpen, discardChanges, keepEditing } =
    useDiscardChangesGuard(isDirty);

  const saveFields = (fields: ActionDeReferenceFields): void => {
    updateAction({ id: action.id, ...fields }, { onUpdated });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(saveFields)}
        className="flex flex-col gap-6 p-4"
      >
        <Field
          title={appLabels.actionDeReferenceTitreLabel}
          state={errors.titre ? 'error' : 'default'}
          message={errors.titre?.message}
        >
          <Input type="text" {...register('titre')} />
        </Field>
        <Field
          title={appLabels.actionDeReferenceDescriptionLabel}
          state={errors.description ? 'error' : 'default'}
          message={errors.description?.message}
        >
          <Textarea {...register('description')} />
        </Field>
        <Controller
          name="levier"
          control={control}
          render={({ field }) => (
            <SingleChoiceField
              title={appLabels.actionDeReferenceLevierLabel}
              options={levierOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="categorie"
          control={control}
          render={({ field }) => (
            <SingleChoiceField
              title={appLabels.actionDeReferenceCategorieLabel}
              options={categorieOptions}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {appLabels.enregistrer}
          </Button>
        </div>
      </form>
      <DiscardChangesConfirmModal
        isOpen={isDiscardConfirmationOpen}
        onDiscard={discardChanges}
        onKeepEditing={keepEditing}
      />
    </>
  );
};

export { UpdateActionDeReferenceForm };
