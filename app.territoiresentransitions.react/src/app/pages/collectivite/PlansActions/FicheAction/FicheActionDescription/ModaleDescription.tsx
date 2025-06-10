import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useSousThematiqueListe } from '@/app/ui/dropdownLists/SousThematiquesDropdown/useSousThematiqueListe';
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { useThematiqueListe } from '@/app/ui/dropdownLists/ThematiquesDropdown/useThematiqueListe';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';

import { SousThematique, Thematique } from '@/domain/shared';
import {
  AutoResizedTextarea,
  Button,
  Field,
  FormSectionGrid,
  Input,
  Modal,
  ModalFooterOKCancel,
  SelectFilter,
} from '@/ui';
import { Option } from '@/ui/design-system/Select/utils';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';

const DESCRIPTION_MAX_LENGTH = 20000;
const MOYENS_MAX_LENGTH = 10000;
const INSTANCES_MAX_LENGTH = 10000;

/**
 * Bouton + modale pour l'édition des informations principales d'une fiche action
 */
type FicheUpdatePayload = Pick<
  Fiche,
  | 'id'
  | 'titre'
  | 'ressources'
  | 'instanceGouvernance'
  | 'thematiques'
  | 'sousThematiques'
  | 'libreTags'
  | 'description'
>;

const useGetThematiqueAndSousThematiqueOptions = ({
  selectedThematiques,
  selectedSousThematiques,
  onThematiqueChange,
}: {
  selectedThematiques: Thematique[];
  selectedSousThematiques: SousThematique[];
  onThematiqueChange: (updatedSousThematiques: SousThematique[]) => void;
}): {
  thematiqueOptions: Array<Option>;
  sousThematiqueOptions: Array<Option>;
  thematiqueListe: Thematique[];
  sousThematiqueListe: SousThematique[];
} => {
  const thematiqueListe = useThematiqueListe();
  const sousThematiqueListe = useSousThematiqueListe();
  const thematiqueOptions = thematiqueListe.map((thematique) => ({
    value: thematique.id,
    label: thematique.nom,
  }));

  const availableSousThematiques: SousThematique[] = useMemo(
    () =>
      sousThematiqueListe.filter(({ thematiqueId }) => {
        return selectedThematiques.some(({ id }) => id === thematiqueId);
      }),
    [sousThematiqueListe, selectedThematiques]
  );
  const sousThematiqueOptions = useMemo(
    () =>
      availableSousThematiques.map(({ id, nom }) => ({
        value: id,
        label: nom,
      })),
    [availableSousThematiques]
  );

  useEffect(() => {
    const updatedSousThematiques = availableSousThematiques.filter(({ id }) =>
      selectedSousThematiques.some(({ id: selectedId }) => selectedId === id)
    );

    if (updatedSousThematiques.length !== selectedSousThematiques.length) {
      onThematiqueChange(updatedSousThematiques);
    }
  }, [
    availableSousThematiques,
    onThematiqueChange,
    selectedSousThematiques,
    sousThematiqueListe,
    sousThematiqueOptions,
  ]);

  return {
    sousThematiqueOptions,
    thematiqueOptions,
    thematiqueListe,
    sousThematiqueListe,
  };
};

const ModaleDescription = ({
  fiche,
  onSubmit,
}: {
  fiche: FicheUpdatePayload;
  onSubmit: (fiche: FicheUpdatePayload) => void;
}) => {
  const {
    handleSubmit,
    register,
    control,
    formState: { isValid },
    setValue,
    watch,
    reset,
  } = useForm<FicheUpdatePayload>({
    defaultValues: fiche,
  });

  useEffect(() => {
    reset(fiche);
  }, [fiche, reset]);

  const {
    thematiques,
    description,
    ressources,
    instanceGouvernance,
    sousThematiques,
  } = watch();

  const {
    sousThematiqueOptions,
    thematiqueOptions,
    sousThematiqueListe,
    thematiqueListe,
  } = useGetThematiqueAndSousThematiqueOptions({
    selectedThematiques: thematiques ?? [],
    selectedSousThematiques: sousThematiques ?? [],
    onThematiqueChange: (updatedSousThematiques) => {
      setValue('sousThematiques', updatedSousThematiques);
    },
  });

  const handleSave =
    (onSuccess: () => void) =>
    async (updatedFiche: FicheUpdatePayload): Promise<void> => {
      const { titre, ...rest } = updatedFiche;
      const titleToSave = (titre ?? '').trim();

      try {
        await onSubmit({
          ...rest,
          titre: titleToSave.length ? titleToSave : null,
        });
        onSuccess();
      } catch (err) {
        console.log(err);
      }
    };

  const formId = `update-fiche-${fiche.id}-form`;
  return (
    <Modal
      title="Modifier la fiche"
      size="lg"
      onClose={reset}
      render={({ close }) => (
        <FormSectionGrid
          formSectionId={formId}
          onSubmit={handleSubmit(handleSave(close))}
        >
          {/* Nom de la fiche action */}
          <Field title="Nom de la fiche action" className="col-span-2">
            <Input type="text" {...register('titre')} />
          </Field>

          {/* Dropdown thématiques */}
          <Field title="Thématique">
            <Controller
              control={control}
              name="thematiques"
              render={({ field }) => (
                <SelectFilter
                  dataTest="thematiques"
                  options={thematiqueOptions}
                  values={field.value?.map((t) => t.id)}
                  onChange={({ values }) =>
                    field.onChange(
                      thematiqueListe?.filter((thematique) =>
                        values?.some((v) => v === thematique.id)
                      )
                    )
                  }
                />
              )}
            />
          </Field>

          {/* Dropdown sous-thématiques */}
          <Field title="Sous-thématique">
            <Controller
              control={control}
              name="sousThematiques"
              render={({ field }) => (
                <SelectFilter
                  dataTest="thematiques"
                  options={sousThematiqueOptions}
                  values={field.value?.map((t) => t.id)}
                  onChange={({ values }) =>
                    field.onChange(
                      sousThematiqueListe?.filter((sousThematique) =>
                        values?.some((v) => v === sousThematique.id)
                      )
                    )
                  }
                />
              )}
            />
          </Field>

          {/* Dropdown tags personnalisés */}
          <Field title="Mes tags de suivi" className="col-span-2">
            <Controller
              control={control}
              name="libreTags"
              render={({ field }) => (
                <TagsSuiviPersoDropdown
                  values={(field.value ?? []).map((t) => t.id)}
                  onChange={({ libresTag }) => field.onChange(libresTag)}
                  additionalKeysToInvalidate={[
                    ['fiche_action', fiche.id.toString()],
                  ]}
                />
              )}
            />
          </Field>

          {/* Description */}
          <Field
            title="Description de l'action"
            className="col-span-2"
            state={
              description?.length === DESCRIPTION_MAX_LENGTH
                ? 'info'
                : 'default'
            }
            message={getMaxLengthMessage(
              description ?? '',
              DESCRIPTION_MAX_LENGTH
            )}
          >
            <AutoResizedTextarea
              className="min-h-[100px]"
              maxLength={DESCRIPTION_MAX_LENGTH}
              {...register('description')}
            />
          </Field>

          {/* Ressources */}
          <Field
            title="Moyens humains et techniques"
            className="col-span-2"
            state={
              ressources?.length === MOYENS_MAX_LENGTH ? 'info' : 'default'
            }
            message={getMaxLengthMessage(ressources ?? '', MOYENS_MAX_LENGTH)}
          >
            <AutoResizedTextarea
              className="min-h-[100px]"
              maxLength={MOYENS_MAX_LENGTH}
              {...register('ressources')}
            />
          </Field>

          {/* Instances de gouvernance */}
          <Field
            title="Instances de gouvernance"
            className="col-span-2"
            state={
              instanceGouvernance?.length === INSTANCES_MAX_LENGTH
                ? 'info'
                : 'default'
            }
            message={getMaxLengthMessage(
              instanceGouvernance ?? '',
              INSTANCES_MAX_LENGTH
            )}
          >
            <AutoResizedTextarea
              className="min-h-[100px]"
              maxLength={INSTANCES_MAX_LENGTH}
              {...register('instanceGouvernance')}
            />
          </Field>
        </FormSectionGrid>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: close,
          }}
          btnOKProps={{
            disabled: !isValid,
            form: formId,
          }}
        />
      )}
    >
      {/* Bouton d'ouverture de la modale */}
      <Button
        icon="edit-fill"
        title="Modifier les informations"
        variant="white"
        size="xs"
        className="h-fit"
      />
    </Modal>
  );
};

export default ModaleDescription;
