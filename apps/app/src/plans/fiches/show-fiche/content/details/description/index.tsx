import EffetsAttendusDropdown from '@/app/ui/dropdownLists/ficheAction/EffetsAttendusDropdown/EffetsAttendusDropdown';
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { useGetThematiqueAndSousThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { cn, SelectMultiple, Spacer } from '@tet/ui';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RichTextEditorWithDebounce } from '../../../components/rich-text-editor-with-debounce';
import { useFicheContext } from '../../../context/fiche-context';
import { InlineEditableItem } from '../editable-item';
import { DescriptionFormValues } from './description-schema';
import { getFieldLabel } from './labels';

const MainTitle = ({
  children,
  size = 'large',
}: {
  children: React.ReactNode;
  size?: 'large' | 'normal';
}) => {
  return (
    <div
      className={cn('text-primary-10 font-bold text-lg', {
        'text-base': size === 'normal',
        'font-normal': size === 'normal',
      })}
    >
      {children}
    </div>
  );
};
export const Description = () => {
  const { fiche, isReadonly, update } = useFicheContext();
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
        update({
          ficheId: fiche.id,
          ficheFields: { [name]: getValues(name) },
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, update, fiche.id, getValues]);

  return (
    <>
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-4">
            <MainTitle>
              {getFieldLabel('description', fiche.description)}
            </MainTitle>
            <RichTextEditorWithDebounce
              contentStyle={{
                size: 'sm',
                color: 'primary',
              }}
              value={field.value ?? ''}
              onChange={(value) => {
                field.onChange(value);
              }}
            />
          </div>
        )}
      />
      <Controller
        name="objectifs"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1">
            <MainTitle size="normal">
              {`${getFieldLabel('objectifs', fiche.objectifs)} : `}
            </MainTitle>
            <RichTextEditorWithDebounce
              contentStyle={{
                size: 'sm',
                color: 'primary',
              }}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          </div>
        )}
      />
      <Spacer height={2} />
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="effetsAttendus"
          control={control}
          render={({ field }) => (
            <InlineEditableItem
              small
              icon="line-chart-line"
              label={getFieldLabel('effetsAttendus', fiche.effetsAttendus)}
              value={
                fiche.effetsAttendus
                  ? fiche.effetsAttendus.map((effet) => effet.nom).join(', ')
                  : undefined
              }
              isReadonly={isReadonly}
              renderOnEdit={() => (
                <EffetsAttendusDropdown
                  openState={{ isOpen: true }}
                  values={field.value ?? undefined}
                  onChange={({ effets }) => {
                    field.onChange(effets);
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="thematiques"
          control={control}
          render={({ field }) => (
            <InlineEditableItem
              small
              icon="folder-line"
              label={getFieldLabel('thematiques', selectedThematiques)}
              value={
                selectedThematiques
                  ?.map((thematique) => thematique.nom)
                  .join(', ') ?? undefined
              }
              isReadonly={isReadonly}
              renderOnEdit={() => (
                <SelectMultiple
                  openState={{ isOpen: true }}
                  options={thematiqueOptions}
                  values={field.value?.map((thematique) => thematique.id)}
                  onChange={({ values }) => {
                    field.onChange(
                      thematiqueListe.filter((thematique) =>
                        values?.some((v) => v === thematique.id)
                      )
                    );
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="sousThematiques"
          control={control}
          render={({ field }) => (
            <InlineEditableItem
              small
              icon="folders-line"
              label={getFieldLabel('sousThematiques', selectedSousThematiques)}
              value={
                selectedSousThematiques
                  ?.map((sousThematique) => sousThematique.nom)
                  .join(', ') ?? undefined
              }
              isReadonly={isReadonly}
              renderOnEdit={() => (
                <SelectMultiple
                  options={sousThematiqueOptions}
                  values={field.value?.map(
                    (sousThematique) => sousThematique.id
                  )}
                  openState={{ isOpen: true }}
                  onChange={({ values }) => {
                    field.onChange(
                      sousThematiqueListe.filter((sousThematique) =>
                        values?.some((v) => v === sousThematique.id)
                      )
                    );
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="libreTags"
          control={control}
          render={({ field }) => (
            <InlineEditableItem
              small
              icon="bookmark-line"
              label={getFieldLabel('libreTags', selectedLibreTags)}
              value={
                selectedLibreTags?.map((tag) => tag.nom).join(', ') ?? undefined
              }
              isReadonly={isReadonly}
              renderOnEdit={() => (
                <TagsSuiviPersoDropdown
                  openState={{ isOpen: true }}
                  values={(field.value ?? []).map((tag) => tag.id)}
                  onChange={({ libresTag }) => {
                    field.onChange(libresTag);
                  }}
                />
              )}
            />
          )}
        />
      </div>
    </>
  );
};
