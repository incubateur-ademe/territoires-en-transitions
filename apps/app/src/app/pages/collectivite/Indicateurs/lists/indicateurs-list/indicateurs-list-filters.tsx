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
import { Checkbox, Field, FormSection } from '@tet/ui';
import { INDICATEUR_LABELS } from '../../constants';

type Props = {
  searchParams: SearchParams;
  setSearchParams: (prams: SearchParams) => void;
  listId: IndicateursListParamOption;
};

export const IndicateursListFilters = ({
  searchParams: filters,
  setSearchParams: setFilters,
  listId,
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
          label={INDICATEUR_LABELS.private.plural}
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
          label={INDICATEUR_LABELS.personalized.plural}
          checked={filters.estPerso}
          disabled={listId === 'perso'}
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
        <Field title="Plan d'action">
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
        <Field title="Personne pilote">
          <PersonnesDropdown
            values={getPilotesValues(filters)}
            disabled={listId === 'mes-indicateurs'}
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
        <Field title="Direction ou service pilote">
          <ServicesPilotesDropdown
            values={filters.serviceIds}
            onChange={({ services }) => {
              const { serviceIds, ...rest } = filters;
              setFilters({
                ...rest,
                ...(services ? { serviceIds: services.map((s) => s.id) } : {}),
              });
            }}
          />
        </Field>
        <Field title="Thématique">
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
