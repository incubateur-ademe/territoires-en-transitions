import { InstanceGouvernanceTagDropdown } from '@/app/collectivites/tags/instance-gouvernance-tag.dropdown';
import { PartenaireTagDropdown } from '@/app/collectivites/tags/partenaire-tag.dropdown';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { StructureTagDropdown } from '@/app/collectivites/tags/structure-tag.dropdown';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import { ficheActionParticipationOptions } from '@/app/ui/dropdownLists/listesStatiques';
import { zodResolver } from '@hookform/resolvers/zod';
import { Select } from '@tet/ui';
import { JSX, useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import FranceIcon from '../../../../../plans/components/france-icon.svg';
import { useFicheContext } from '../../../context/fiche-context';
import { InlineEditableItem } from '../editable-item';
import { acteursFormSchema, ActeursFormValues } from './acteurs-schema';
import { getFieldLabel } from './labels';

const formatList = <T,>(
  items: T[] | null | undefined,
  getName: (item: T) => string
) => {
  if (!items || items.length === 0) return undefined;
  return items.map(getName).join(', ');
};

export const Acteurs = (): JSX.Element => {
  const { fiche, isReadonly, update } = useFicheContext();

  const { control, watch, handleSubmit } = useForm<ActeursFormValues>({
    resolver: zodResolver(acteursFormSchema),
    mode: 'onChange',
    defaultValues: {
      services: fiche.services ?? null,
      structures: fiche.structures ?? null,
      referents: fiche.referents ?? null,
      partenaires: fiche.partenaires ?? null,
      cibles: fiche.cibles ?? null,
      instanceGouvernance: fiche.instanceGouvernance ?? null,
      participationCitoyenne: fiche.participationCitoyenne ?? null,
    },
  });

  const allFicheCollectiviteIds = getFicheAllEditorCollectiviteIds(fiche);

  const onSubmit = useCallback(
    async (
      formValues: ActeursFormValues,
      fieldName: keyof ActeursFormValues
    ) => {
      const currentValue = formValues[fieldName];
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

      handleSubmit((data) => onSubmit(data, name as keyof ActeursFormValues))();
    });
    return () => subscription.unsubscribe();
  }, [watch, handleSubmit, onSubmit]);

  return (
    <>
      <Controller
        control={control}
        name="services"
        render={({ field }) => (
          <InlineEditableItem
            icon="briefcase-line"
            label={getFieldLabel('services', field.value)}
            value={formatList(field.value, (s) => s.nom)}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <ServiceTagDropdown
                inlineEdit
                openState={openState}
                collectiviteIds={allFicheCollectiviteIds}
                values={field.value?.map((s) => s.id) ?? []}
                onChange={({ values: services }) => {
                  field.onChange(services);
                }}
              />
            )}
          />
        )}
      />
      <Controller
        control={control}
        name="structures"
        render={({ field }) => (
          <InlineEditableItem
            icon="seedling-line"
            label={getFieldLabel('structures', field.value)}
            value={formatList(field.value, (s) => s.nom)}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <StructureTagDropdown
                inlineEdit
                openState={openState}
                values={field.value?.map((s) => s.id) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                onChange={({ values }) => {
                  field.onChange(values);
                }}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="referents"
        render={({ field }) => (
          <InlineEditableItem
            icon={<FranceIcon className="h-4 w-4 fill-primary-8" />}
            label={getFieldLabel('referents', field.value)}
            value={formatList(field.value, (r) => r.nom || 'Sans nom')}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <PersonneTagDropdown
                inlineEdit
                openState={openState}
                values={field.value?.map((r) => getPersonneStringId(r)) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                placeholder="Sélectionner ou créer un·e élu·e référent·e"
                onChange={({ personnes }) => {
                  field.onChange(personnes);
                }}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="instanceGouvernance"
        render={({ field }) => (
          <InlineEditableItem
            icon="user-star-line"
            label={getFieldLabel('instanceGouvernance', field.value)}
            value={formatList(field.value, (t) => t.nom)}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <InstanceGouvernanceTagDropdown
                inlineEdit
                openState={openState}
                values={field.value?.map((t) => t.id) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                onChange={({ values }) => field.onChange(values)}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="partenaires"
        render={({ field }) => (
          <InlineEditableItem
            icon="team-line"
            label={getFieldLabel('partenaires', field.value)}
            value={formatList(field.value, (p) => p.nom)}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <PartenaireTagDropdown
                inlineEdit
                openState={openState}
                values={field.value?.map((p) => p.id) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                onChange={({ values }) => {
                  field.onChange(values);
                }}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="cibles"
        render={({ field }) => (
          <InlineEditableItem
            icon="crosshair-2-line"
            label={getFieldLabel('cibles', field.value)}
            value={formatList(field.value, (c) => c)}
            isReadonly={isReadonly}
            renderOnEdit={({ openState }) => (
              <CiblesDropdown
                inlineEdit
                openState={openState}
                values={field.value ?? []}
                onChange={({ cibles }) => {
                  field.onChange(cibles);
                }}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="participationCitoyenne"
        render={({ field }) => {
          const selectedOption = ficheActionParticipationOptions.find(
            (option) => option.value === field.value
          );
          return (
            <InlineEditableItem
              icon="shake-hands-line"
              label={getFieldLabel('participationCitoyenne', field.value)}
              value={selectedOption?.label}
              isReadonly={isReadonly}
              renderOnEdit={({ openState }) => (
                <Select
                  inlineEdit
                  openState={openState}
                  options={ficheActionParticipationOptions}
                  values={field.value ?? undefined}
                  onChange={(participation) => {
                    field.onChange(participation ?? null);
                  }}
                />
              )}
            />
          );
        }}
      />
    </>
  );
};
