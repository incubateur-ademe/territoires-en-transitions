import EffetsAttendusDropdown from '@/app/ui/dropdownLists/ficheAction/EffetsAttendusDropdown/EffetsAttendusDropdown';
import TagsSuiviPersoDropdown from '@/app/ui/dropdownLists/TagsSuiviPersoDropdown/TagsSuiviPersoDropdown';
import { useGetThematiqueAndSousThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { cn, RichTextEditor, SelectMultiple, Tooltip } from '@tet/ui';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

  // RichTextEditor behaves strangely when controlled hence
  // only the initial value is used on first mount to keep the
  // component uncontrolled
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialDescription = useMemo(() => fiche.description ?? '', []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialObjectifs = useMemo(() => fiche.objectifs ?? '', []);

  return (
    <>
      <div className="flex flex-col">
        <MainTitle>{getFieldLabel('description', fiche.description)}</MainTitle>
        <RichTextEditor
          unstyled
          contentStyle={{
            size: 'sm',
            color: 'primary',
          }}
          initialValue={initialDescription}
          onChange={(html) => setValue('description', html)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <MainTitle size="normal">
          {`${getFieldLabel('objectifs', fiche.objectifs)} : `}
        </MainTitle>
        <RichTextEditor
          unstyled
          contentStyle={{
            size: 'sm',
            color: 'primary',
          }}
          initialValue={initialObjectifs}
          onChange={(html) => setValue('objectifs', html)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
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
              renderOnEdit={({ openState }) => (
                <div className="w-full max-w-[400px]">
                  <EffetsAttendusDropdown
                    openState={openState}
                    values={field.value ?? undefined}
                    onChange={({ effets }) => {
                      field.onChange(effets);
                    }}
                  />
                </div>
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
              renderOnEdit={({ openState }) => (
                <TagsSuiviPersoDropdown
                  openState={openState}
                  values={(field.value ?? []).map((tag) => tag.id)}
                  onChange={({ libresTag }) => {
                    field.onChange(libresTag);
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
                selectedThematiques?.length
                  ? selectedThematiques
                      .map((thematique) => thematique.nom)
                      .join(', ')
                  : 'À renseigner'
              }
              isReadonly={isReadonly}
              renderOnEdit={({ openState }) => (
                <SelectMultiple
                  openState={openState}
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
                !selectedSousThematiques?.length ? (
                  <Tooltip label="Veuillez d'abord sélectionner une thématique pour pouvoir sélectionner une ou plusieurs sous-thématiques">
                    <span>À renseigner</span>
                  </Tooltip>
                ) : (
                  selectedSousThematiques
                    ?.map((sousThematique) => sousThematique.nom)
                    .join(', ') ?? undefined
                )
              }
              isReadonly={isReadonly || !selectedThematiques?.length}
              renderOnEdit={({ openState }) => (
                <SelectMultiple
                  buttonClassName={
                    !selectedThematiques?.length ? 'cursor-disabled' : ''
                  }
                  options={sousThematiqueOptions}
                  values={field.value?.map(
                    (sousThematique) => sousThematique.id
                  )}
                  openState={openState}
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
      </div>
    </>
  );
};
