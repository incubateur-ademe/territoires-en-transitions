import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import type { CloseRequestOutcome } from '@/app/ui/layout/side-panel/side-panel.contract';
import { LoadingStatus } from '@/app/ui/shared/loading-status';
import { ErrorCard } from '@/app/utils/error/error.card';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  actionDeReferenceSchema,
  type CategorieAction,
  categorieActionEnumValues,
  LEVIER_NOM_BY_ID,
  type LevierId,
  levierIdEnumValues,
} from '@tet/domain/shared';
import {
  Button,
  Field,
  Input,
  type Option,
  SelectMultiple,
  Textarea,
} from '@tet/ui';
import { type JSX, useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import * as z from 'zod/mini';
import type {
  UpdateActionDeReferenceFieldsProps,
  UpdateActionDeReferenceFormComponent,
} from './actions-de-reference.contract';
import { useUpdateActionDeReference } from './data/use-update-action-de-reference';
import { DiscardChangesConfirmModal } from './discard-changes-confirm.modal';
import { isFicheIdsText, toFicheIds, toFicheIdsText } from './fiche-ids.text';

const actionDeReferenceFieldsSchema = z.extend(
  z.omit(actionDeReferenceSchema, { id: true }),
  {
    ficheIds: z.string().check(
      z.refine(isFicheIdsText, {
        error: appLabels.actionDeReferenceFichesLieesErreur,
      })
    ),
  }
);

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

type MultiChoiceFieldProps<Value extends string> = {
  readonly title: string;
  readonly options: readonly ChoiceOption<Value>[];
  readonly values: readonly Value[];
  readonly onChange: (values: readonly Value[]) => void;
  readonly errorMessage?: string;
};

const MultiChoiceField = <Value extends string>({
  title,
  options,
  values,
  onChange,
  errorMessage,
}: MultiChoiceFieldProps<Value>): JSX.Element => (
  <Field
    title={title}
    state={errorMessage ? 'error' : 'default'}
    message={errorMessage}
  >
    <SelectMultiple
      options={[...options]}
      values={[...values]}
      onChange={({ values: chosenValues }) =>
        onChange(
          options
            .map((option) => option.value)
            .filter((knownValue) => chosenValues?.includes(knownValue))
        )
      }
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

const UpdateActionDeReferenceFields = ({
  action,
  onUpdated,
  initialFicheIds,
}: UpdateActionDeReferenceFieldsProps): JSX.Element => {
  const { updateAction, isPending } = useUpdateActionDeReference();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<ActionDeReferenceFields>({
    resolver: zodResolver(actionDeReferenceFieldsSchema, {
      error: toFieldErrorMessage,
    }),
    mode: 'onChange',
    defaultValues: {
      titre: action.titre,
      description: action.description,
      leviers: action.leviers,
      categories: action.categories,
      ficheIds: toFicheIdsText(initialFicheIds),
    },
  });

  const { isDiscardConfirmationOpen, discardChanges, keepEditing } =
    useDiscardChangesGuard(isDirty);

  const saveFields = ({
    ficheIds,
    ...actionFields
  }: ActionDeReferenceFields): void => {
    const actionChanges = { id: action.id, ...actionFields };
    if (!dirtyFields.ficheIds) {
      updateAction(actionChanges, { onUpdated });
      return;
    }
    updateAction(
      { ...actionChanges, ficheIds: toFicheIds(ficheIds) },
      { onUpdated }
    );
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
          name="leviers"
          control={control}
          render={({ field, fieldState }) => (
            <MultiChoiceField
              title={appLabels.actionDeReferenceLevierLabel}
              options={levierOptions}
              values={field.value}
              onChange={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="categories"
          control={control}
          render={({ field, fieldState }) => (
            <MultiChoiceField
              title={appLabels.actionDeReferenceCategorieLabel}
              options={categorieOptions}
              values={field.value}
              onChange={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Field
          title={appLabels.actionDeReferenceFichesLieesLabel}
          hint={appLabels.actionDeReferenceFichesLieesHint}
          state={errors.ficheIds ? 'error' : 'default'}
          message={errors.ficheIds?.message}
        >
          <Input type="text" {...register('ficheIds')} />
        </Field>
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

const UpdateActionDeReferenceForm: UpdateActionDeReferenceFormComponent = ({
  action,
  onUpdated,
  fichesList,
}) => {
  return match(fichesList)
    .with({ status: 'loading' }, () => <LoadingStatus />)
    .with({ status: 'error' }, ({ retry }) => (
      <ErrorCard
        title={appLabels.uneErreurEstSurvenue}
        retry={retry}
        retryLabel={appLabels.reessayer}
      />
    ))
    .with({ status: 'loaded' }, ({ fiches: linkedFiches }) => (
      <UpdateActionDeReferenceFields
        action={action}
        onUpdated={onUpdated}
        initialFicheIds={linkedFiches.map(({ id }) => id)}
      />
    ))
    .exhaustive();
};

export { UpdateActionDeReferenceForm };
