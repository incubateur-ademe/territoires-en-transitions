import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import PartenairesDropdown from '@/app/ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from '@/app/ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Textarea } from '@tet/ui';
import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import FranceIcon from '../../../../../plans/components/france-icon.svg';
import { useFicheContext } from '../../../context/fiche-context';
import { TemporaryEditableItem } from '../layout';
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
  const ficheActionInvalidationKeys = [['fiche_action', fiche.id.toString()]];

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
        name="structures"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="seedling-line"
            label={getFieldLabel('structures', field.value)}
            value={formatList(field.value, (s) => s.nom)}
            isReadonly={isReadonly}
            editComponent={() => (
              <StructuresDropdown
                values={field.value?.map((s) => s.id) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                onChange={({ structures }) => {
                  field.onChange(structures);
                }}
                additionalKeysToInvalidate={ficheActionInvalidationKeys}
              />
            )}
          />
        )}
      />
      <Controller
        control={control}
        name="services"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="leaf-line"
            label={getFieldLabel('services', field.value)}
            value={formatList(field.value, (s) => s.nom)}
            isReadonly={isReadonly}
            editComponent={() => (
              <ServicesPilotesDropdown
                placeholder="Sélectionnez ou créez un pilote"
                collectiviteIds={allFicheCollectiviteIds}
                values={field.value?.map((s) => s.id) ?? []}
                onChange={({ services }) => {
                  field.onChange(services);
                }}
                additionalKeysToInvalidate={ficheActionInvalidationKeys}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="referents"
        render={({ field }) => (
          <TemporaryEditableItem
            icon={<FranceIcon className="h-4 w-4 fill-primary-8" />}
            label={getFieldLabel('referents', field.value)}
            value={formatList(field.value, (r) => r.nom || 'Sans nom')}
            isReadonly={isReadonly}
            editComponent={() => (
              <PersonnesDropdown
                values={field.value?.map((r) => getPersonneStringId(r)) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                placeholder="Sélectionnez ou créez un·e élu·e référent·e"
                onChange={({ personnes }) => {
                  field.onChange(personnes);
                }}
                additionalKeysToInvalidate={ficheActionInvalidationKeys}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="instanceGouvernance"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="user-star-line"
            label={getFieldLabel('instanceGouvernance', field.value)}
            value={field.value}
            isReadonly={isReadonly}
            editComponent={() => (
              <Input
                type="text"
                autoFocus
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder="Instance de gouvernance"
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="partenaires"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="team-line"
            label={getFieldLabel('partenaires', field.value)}
            value={formatList(field.value, (p) => p.nom)}
            isReadonly={isReadonly}
            editComponent={() => (
              <PartenairesDropdown
                values={field.value?.map((p) => p.id) ?? []}
                collectiviteIds={allFicheCollectiviteIds}
                onChange={({ partenaires }) => {
                  field.onChange(partenaires);
                }}
                additionalKeysToInvalidate={ficheActionInvalidationKeys}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="cibles"
        render={({ field }) => (
          <TemporaryEditableItem
            icon="crosshair-2-line"
            label={getFieldLabel('cibles', field.value)}
            value={field.value?.join(', ')}
            isReadonly={isReadonly}
            editComponent={() => (
              <CiblesDropdown
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
        render={({ field }) => (
          <TemporaryEditableItem
            icon="shake-hands-line"
            label={getFieldLabel('participationCitoyenne', field.value)}
            value={field.value}
            isReadonly={isReadonly}
            editComponent={() => (
              <Textarea
                tabIndex={0}
                autoFocus
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value)}
                placeholder="Détaillez la participation citoyenne"
              />
            )}
          />
        )}
      />
    </>
  );
};
