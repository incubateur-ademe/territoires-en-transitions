import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';

import { Field, Input } from '@/ui';

import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { useGetThematiqueAndSousThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import { FormSectionGrid } from '@/ui';

import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { AutoResizedTextarea, SelectFilter } from '@/ui';
import { Controller, useForm } from 'react-hook-form';

const DESCRIPTION_MAX_LENGTH = 20000;
const MOYENS_MAX_LENGTH = 10000;
const INSTANCES_MAX_LENGTH = 10000;

export type FicheUpdatePayload = Pick<
  Fiche,
  | 'id'
  | 'titre'
  | 'ressources'
  | 'instanceGouvernance'
  | 'thematiques'
  | 'sousThematiques'
  | 'libreTags'
  | 'description'
> &
  FicheShareProperties;

export const FicheDescriptionForm = ({
  fiche,
  onSubmit,
  formId,
}: {
  fiche: FicheUpdatePayload;
  onSubmit: (fiche: FicheUpdatePayload) => void;
  formId: string;
}) => {
  const { handleSubmit, register, control, setValue, watch } =
    useForm<FicheUpdatePayload>({
      defaultValues: fiche,
    });

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

  const handleSave = async (
    updatedFiche: FicheUpdatePayload
  ): Promise<void> => {
    const titleToSave = (updatedFiche.titre ?? '').trim();

    onSubmit({
      id: updatedFiche.id,
      titre: titleToSave.length ? titleToSave : null,
      ressources: updatedFiche.ressources,
      instanceGouvernance: updatedFiche.instanceGouvernance,
      thematiques: updatedFiche.thematiques,
      sousThematiques: updatedFiche.sousThematiques,
      libreTags: updatedFiche.libreTags,
      description: updatedFiche.description,
      collectiviteId: updatedFiche.collectiviteId,
      collectiviteNom: updatedFiche.collectiviteNom ?? null,
      sharedWithCollectivites: updatedFiche.sharedWithCollectivites ?? null,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleSave)}>
      <FormSectionGrid>
        <Field title="Nom de la fiche action" className="col-span-2">
          <Input type="text" {...register('titre')} />
        </Field>

        <Field title="Thématique">
          <Controller
            control={control}
            name="thematiques"
            render={({ field }) => (
              <SelectFilter
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

        <Field title="Sous-thématique">
          <Controller
            control={control}
            name="sousThematiques"
            render={({ field }) => (
              <SelectFilter
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

        <Field title="Mes tags de suivi" className="col-span-2">
          <Controller
            control={control}
            name="libreTags"
            render={({ field }) => (
              <TagsSuiviPersoDropdown
                collectiviteIds={getFicheAllEditorCollectiviteIds(fiche)}
                values={(field.value ?? []).map((t) => t.id)}
                onChange={({ libresTag }) => field.onChange(libresTag)}
                additionalKeysToInvalidate={[
                  ['fiche_action', fiche.id.toString()],
                ]}
              />
            )}
          />
        </Field>

        <Field
          title="Description de l'action"
          className="col-span-2"
          state={
            description?.length === DESCRIPTION_MAX_LENGTH ? 'info' : 'default'
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

        <Field
          title="Moyens humains et techniques"
          className="col-span-2"
          state={ressources?.length === MOYENS_MAX_LENGTH ? 'info' : 'default'}
          message={getMaxLengthMessage(ressources ?? '', MOYENS_MAX_LENGTH)}
        >
          <AutoResizedTextarea
            className="min-h-[100px]"
            maxLength={MOYENS_MAX_LENGTH}
            {...register('ressources')}
          />
        </Field>

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
    </form>
  );
};
