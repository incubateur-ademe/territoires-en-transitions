import { SearchParams } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/use-indicateurs-list-params';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import { appLabels } from '@/app/labels/catalog';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import IndicateurCategoriesDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCategoriesDropdown';
import IndicateurCompletsDropdown from '@/app/ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import { Checkbox, Field, FormSection } from '@tet/ui';

type Props = {
  searchParams: SearchParams;
  setSearchParams: (prams: SearchParams) => void;
};

export const IndicateursListFilters = ({
  searchParams: filters,
  setSearchParams: setFilters,
}: Props) => {
  return (
    <div className="w-96 md:w-[48rem] grid md:grid-cols-2 gap-8 lg:gap-12 p-4 lg:p-8">
      <FormSection title="Typologie :" className="!grid-cols-1">
        <Checkbox
          label="Données Open Data"
          checked={filters.hasOpenData}
          onChange={() => {
            const { hasOpenData, ...rest } = filters;
            setFilters({
              ...rest,
              ...(!hasOpenData ? { hasOpenData: true } : {}),
            });
          }}
        />
        <Field title="Catégorie">
          <IndicateurCategoriesDropdown
            values={filters.categorieNoms}
            onChange={({ categories }) => {
              const { categorieNoms, ...rest } = filters;
              setFilters({
                ...rest,
                ...(categories?.length > 0
                  ? { categorieNoms: categories }
                  : {}),
              });
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
              const { estRempli, ...rest } = filters;
              setFilters({
                ...rest,
                ...(value
                  ? {
                      estRempli: value === 'rempli',
                    }
                  : {}),
              });
            }}
          />
        </Field>
        <Checkbox
          label="Participe au score Climat Air Énergie"
          checked={filters.participationScore}
          onChange={() => {
            const { participationScore, ...rest } = filters;
            setFilters({
              ...rest,
              ...(!participationScore ? { participationScore: true } : {}),
            });
          }}
        />
        <Checkbox
          label={appLabels.indicateursPrives}
          checked={filters.estConfidentiel}
          onChange={() => {
            const { estConfidentiel, ...rest } = filters;
            setFilters({
              ...rest,
              ...(!estConfidentiel ? { estConfidentiel: true } : {}),
            });
          }}
        />
        <Checkbox
          label={appLabels.indicateursPersonnalises}
          checked={filters.estPerso}
          onChange={() => {
            const { estPerso, ...rest } = filters;
            setFilters({
              ...rest,
              ...(!estPerso ? { estPerso: true } : {}),
            });
          }}
        />
      </FormSection>

      <FormSection title="Pilotage :" className="!grid-cols-1">
        <Field title="Plan">
          <PlansActionDropdown
            values={filters.planIds}
            onChange={({ plans }) => {
              const { planIds, ...rest } = filters;
              setFilters({
                ...rest,
                ...(plans ? { planIds: plans } : {}),
              });
            }}
          />
        </Field>
        <Field title={appLabels.personnePilote()}>
          <PersonneTagDropdown
            values={getPilotesValues(filters)}
            onChange={({ personnes }) => {
              const { personnePiloteIds, utilisateurPiloteIds, ...rest } =
                filters;
              const { personnePiloteIds: pIds, utilisateurPiloteIds: uIds } =
                splitPilotePersonnesAndUsers(personnes);
              setFilters({
                ...rest,
                ...(pIds.length > 0 ? { personnePiloteIds: pIds } : {}),
                ...(uIds.length > 0
                  ? {
                      utilisateurPiloteIds: uIds,
                    }
                  : {}),
              });
            }}
          />
        </Field>
        <Field title={appLabels.directionOuServicePilote()}>
          <ServiceTagDropdown
            values={filters.serviceIds}
            onChange={({ values: services }) => {
              const { serviceIds, ...rest } = filters;
              setFilters({
                ...rest,
                ...(services ? { serviceIds: services.map((s) => s.id) } : {}),
              });
            }}
          />
        </Field>
        <Field title={appLabels.thematique()}>
          <ThematiquesDropdown
            values={filters.thematiqueIds}
            onChange={(thematiques) => {
              const { thematiqueIds, ...rest } = filters;
              setFilters({
                ...rest,
                ...(thematiques.length > 0
                  ? { thematiqueIds: thematiques }
                  : {}),
              });
            }}
          />
        </Field>
      </FormSection>
    </div>
  );
};
