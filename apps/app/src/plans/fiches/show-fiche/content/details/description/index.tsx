import EffetsAttendusDropdown from '@/app/ui/dropdownLists/ficheAction/EffetsAttendusDropdown/EffetsAttendusDropdown';
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { useGetThematiqueAndSousThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { SelectMultiple, Textarea } from '@tet/ui';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useFicheContext } from '../../../context/fiche-context';
import { TemporaryEditableItem } from '../layout';
import { DescriptionFormValues } from './description-schema';
import { getFieldLabel } from './labels';

export const Description = () => {
  const { fiche, isReadonly, updateFiche } = useFicheContext();
  const { control, watch, getValues, setValue } =
    useForm<DescriptionFormValues>({
      defaultValues: {
        description: fiche.description,
        objectifs: fiche.objectifs,
        effetsAttendus: fiche.effetsAttendus,
        thematiques: fiche.thematiques,
        sousThematiques: fiche.sousThematiques,
        libreTags: fiche.libreTags,
      },
    });

  const selectedThematiques = watch('thematiques');
  const selectedSousThematiques = watch('sousThematiques');
  const selectedLibreTags = watch('libreTags');
  const {
    thematiqueOptions,
    sousThematiqueOptions,
    thematiqueListe,
    sousThematiqueListe,
  } = useGetThematiqueAndSousThematiqueOptions({
    selectedThematiques: selectedThematiques ?? [],
    selectedSousThematiques: selectedSousThematiques ?? [],
    onThematiqueChange: (updatedSousThematiques) => {
      setValue('sousThematiques', updatedSousThematiques);
    },
  });

  useEffect(() => {
    const subscription = watch((_formValues, { name }) => {
      if (name) {
        updateFiche({
          ficheId: fiche.id,
          ficheFields: { [name]: getValues(name) },
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updateFiche, fiche.id, getValues]);

  return (
    <>
      <TemporaryEditableItem
        icon="todo-line"
        label={getFieldLabel('description', fiche.description)}
        value={fiche.description}
        isReadonly={isReadonly}
        editComponent={(onBlur) => (
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
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
      <TemporaryEditableItem
        icon="line-chart-line"
        label={getFieldLabel('effetsAttendus', fiche.effetsAttendus)}
        value={
          fiche.effetsAttendus
            ? fiche.effetsAttendus.map((effet) => effet.nom).join(', ')
            : undefined
        }
        isReadonly={isReadonly}
        editComponent={() => (
          <Controller
            name="effetsAttendus"
            control={control}
            render={({ field }) => (
              <div className="flex-1">
                <EffetsAttendusDropdown
                  values={field.value ?? undefined}
                  onChange={({ effets }) => field.onChange(effets)}
                />
              </div>
            )}
          />
        )}
      />
      <TemporaryEditableItem
        icon="todo-line"
        label={getFieldLabel('objectifs', fiche.objectifs)}
        value={fiche.objectifs}
        isReadonly={isReadonly}
        editComponent={(onBlur) => (
          <Controller
            name="objectifs"
            control={control}
            render={({ field }) => (
              <Textarea
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
      <TemporaryEditableItem
        icon="folder-line"
        label={getFieldLabel('thematiques', selectedThematiques)}
        value={
          selectedThematiques?.map((thematique) => thematique.nom).join(', ') ??
          undefined
        }
        isReadonly={isReadonly}
        editComponent={() => (
          <Controller
            name="thematiques"
            control={control}
            render={({ field }) => (
              <SelectMultiple
                options={thematiqueOptions}
                values={field.value?.map((thematique) => thematique.id)}
                onChange={({ values }) =>
                  field.onChange(
                    thematiqueListe.filter((thematique) =>
                      values?.some((v) => v === thematique.id)
                    )
                  )
                }
              />
            )}
          />
        )}
      />
      <TemporaryEditableItem
        icon="folders-line"
        label={getFieldLabel('sousThematiques', selectedSousThematiques)}
        value={
          selectedSousThematiques
            ?.map((sousThematique) => sousThematique.nom)
            .join(', ') ?? undefined
        }
        isReadonly={isReadonly}
        editComponent={() => (
          <Controller
            name="sousThematiques"
            control={control}
            render={({ field }) => (
              <SelectMultiple
                options={sousThematiqueOptions}
                values={field.value?.map((sousThematique) => sousThematique.id)}
                onChange={({ values }) =>
                  field.onChange(
                    sousThematiqueListe.filter((sousThematique) =>
                      values?.some((v) => v === sousThematique.id)
                    )
                  )
                }
              />
            )}
          />
        )}
      />
      <TemporaryEditableItem
        icon="bookmark-line"
        label={getFieldLabel('libreTags', selectedLibreTags)}
        value={selectedLibreTags?.map((tag) => tag.nom).join(', ') ?? undefined}
        isReadonly={isReadonly}
        editComponent={() => (
          <Controller
            name="libreTags"
            control={control}
            render={({ field }) => (
              <TagsSuiviPersoDropdown
                values={(field.value ?? []).map((tag) => tag.id)}
                onChange={({ libresTag }) => field.onChange(libresTag)}
              />
            )}
          />
        )}
      />
    </>
  );
};
