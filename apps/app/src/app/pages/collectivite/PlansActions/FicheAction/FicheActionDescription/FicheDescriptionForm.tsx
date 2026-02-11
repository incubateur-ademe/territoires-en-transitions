import { Field, Input } from '@tet/ui';

import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { useGetThematiqueAndSousThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import { FormSectionGrid } from '@tet/ui';

import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { InstanceGouvernanceDropdown } from '@/app/plans/fiches/shared/dropdowns/instance-gouvernance.dropdown';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { RichTextEditor, SelectFilter } from '@tet/ui';
import { Controller, useForm } from 'react-hook-form';
import { Fiche } from '../data/use-get-fiche';
const DESCRIPTION_MAX_LENGTH = 20000;

export type FicheUpdatePayload = Pick<
  Fiche,
  | 'id'
  | 'titre'
  | 'instanceGouvernance'
  | 'thematiques'
  | 'sousThematiques'
  | 'libreTags'
  | 'description'
  | 'collectiviteId'
  | 'collectiviteNom'
  | 'sharedWithCollectivites'
>;

export const FicheDescriptionForm = ({
  fiche,
  onSubmit,
  formId,
}: {
  fiche: FicheWithRelations;
  onSubmit: (fiche: FicheUpdatePayload) => void;
  formId: string;
}) => {
  const collectiviteId = useCollectiviteId();
  const { handleSubmit, register, control, setValue, watch } =
    useForm<FicheWithRelations>({
      defaultValues: fiche,
    });

  const { thematiques, description, sousThematiques } = watch();

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

  const handleSave = async (updatedFiche: Fiche): Promise<void> => {
    const titleToSave = (updatedFiche.titre ?? '').trim();

    onSubmit({
      id: updatedFiche.id,
      titre: titleToSave.length ? titleToSave : null,
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
        <Field title="Nom de l'action" className="col-span-2">
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
            DESCRIPTION_MAX_LENGTH,
            true
          )}
        >
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <RichTextEditor
                initialValue={fiche.description || ''}
                onChange={(value) => field.onChange(value)}
              />
            )}
          />
        </Field>

        <Field title="Instances de gouvernance" className="col-span-2">
          <Controller
            control={control}
            name="instanceGouvernance"
            render={({ field }) => (
              <InstanceGouvernanceDropdown
                collectiviteId={collectiviteId}
                values={field.value?.map((t) => t.id) ?? null}
                onChange={(tags) => field.onChange(tags)}
                ficheId={fiche.id}
              />
            )}
          />
        </Field>
      </FormSectionGrid>
    </form>
  );
};
