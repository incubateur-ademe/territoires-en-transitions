import { INDICATEUR_LABELS } from '@/app/app/pages/collectivite/Indicateurs/constants';
import { SearchParams } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import { IndicateursListParamOption } from '@/app/app/paths';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import IndicateurCategoriesDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCategoriesDropdown';
import IndicateurCompletsDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import { Checkbox, Field, FormSection } from '@/ui';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

type Props = {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  listId: IndicateursListParamOption;
};

export const IndicateursListFilters = ({
  searchParams: defaultFilters,
  setSearchParams,
  listId,
}: Props) => {
  const { setValue, watch } = useForm<SearchParams>({
    defaultValues: defaultFilters,
  });
  const filters = watch();

  useEffect(() => {
    setSearchParams(filters);
  }, [filters, setSearchParams]);
  return (
    <div className="w-96 md:w-[48rem] grid md:grid-cols-2 gap-8 lg:gap-12 p-4 lg:p-8">
      <FormSection title="Typologie :" className="!grid-cols-1">
        <Checkbox
          label="Données Open Data"
          checked={!!filters.hasOpenData}
          onChange={() =>
            setValue(
              'hasOpenData',
              filters.hasOpenData === true ? true : undefined
            )
          }
        />
        <Field title="Catégorie">
          <IndicateurCategoriesDropdown
            values={filters.categorieNoms}
            onChange={({ categories }) => {
              setValue(
                'categorieNoms',
                categories && categories.length > 0 ? categories : undefined
              );
            }}
          />
        </Field>
        <Field title="Indicateur complété par la collectivité">
          <IndicateurCompletsDropdown
            values={
              filters.estRempli === undefined
                ? undefined
                : filters.estRempli
                ? 'rempli'
                : 'incomplet'
            }
            onChange={(value) => {
              setValue('estRempli', value ? value === 'rempli' : undefined);
            }}
          />
        </Field>
        <Checkbox
          label="Participe au score Climat Air Énergie"
          checked={!!filters.participationScore}
          onChange={() =>
            setValue(
              'participationScore',
              filters.participationScore === true ? true : undefined
            )
          }
        />
        <Checkbox
          label={INDICATEUR_LABELS.private.plural}
          checked={!!filters.estConfidentiel}
          onChange={() => setValue('estConfidentiel', !filters.estConfidentiel)}
        />
        <Checkbox
          label={INDICATEUR_LABELS.personalized.plural}
          checked={!!filters.estPerso}
          disabled={listId === 'perso'}
          onChange={() =>
            setValue('estPerso', filters.estPerso === true ? true : undefined)
          }
        />
      </FormSection>

      <FormSection title="Pilotage :" className="!grid-cols-1">
        <Field title="Plan d'action">
          <PlansActionDropdown
            values={filters.planIds}
            onChange={({ plans }) => {
              setValue(
                'planIds',
                plans && plans.length > 0 ? plans : undefined
              );
            }}
          />
        </Field>
        <Field title="Personne pilote">
          <PersonnesDropdown
            values={getPilotesValues(filters)}
            disabled={listId === 'mes-indicateurs'}
            onChange={({ personnes }) => {
              const { personnePiloteIds: pIds, utilisateurPiloteIds: uIds } =
                splitPilotePersonnesAndUsers(personnes);
              setValue('personnePiloteIds', pIds.length > 0 ? pIds : undefined);
              setValue(
                'utilisateurPiloteIds',
                uIds.length > 0 ? uIds : undefined
              );
            }}
          />
        </Field>
        <Field title="Direction ou service pilote">
          <ServicesPilotesDropdown
            values={filters.serviceIds}
            onChange={({ services }) => {
              setValue(
                'serviceIds',
                services ? services.map((s) => s.id) : undefined
              );
            }}
          />
        </Field>
        <Field title="Thématique">
          <ThematiquesDropdown
            values={filters.thematiqueIds}
            onChange={(thematiques) => {
              setValue(
                'thematiqueIds',
                thematiques.length > 0 ? thematiques : undefined
              );
            }}
          />
        </Field>
      </FormSection>
    </div>
  );
};
