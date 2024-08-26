import {Checkbox, Field, FormSection} from '@tet/ui';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  splitPilotePersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import PlansActionDropdown from 'ui/dropdownLists/PlansActionDropdown';
import IndicateurCompletsDropdown from 'ui/dropdownLists/indicateur/IndicateurCompletsDropdown';
import IndicateurCategoriesDropdown from 'ui/dropdownLists/indicateur/IndicateurCategoriesDropdown';
import {FetchFiltre} from '@tet/api/dist/src/indicateurs';

type Props = {
  filters: FetchFiltre;
  setFilters: (filters: FetchFiltre) => void;
};

const MenuFiltresTousLesIndicateurs = ({filters, setFilters}: Props) => {
  return (
    <div className="w-80 flex flex-col gap-8">
      <FormSection title="Pilotage :" className="!grid-cols-1">
        <Field title="Plan d'action">
          <PlansActionDropdown
            values={filters.planActionIds}
            onChange={({plans}) => {
              const {planActionIds, ...rest} = filters;
              setFilters({
                ...rest,
                ...(plans ? {planActionIds: plans} : {}),
              });
            }}
          />
        </Field>
        <Field title="Personne pilote">
          <PersonnesDropdown
            values={getPilotesValues(filters)}
            onChange={({personnes}) => {
              const {personnePiloteIds, utilisateurPiloteIds, ...rest} =
                filters;
              const {personnePiloteIds: pIds, utilisateurPiloteIds: uIds} =
                splitPilotePersonnesAndUsers(personnes);
              setFilters({
                ...rest,
                ...(pIds.length > 0 ? {personnePiloteIds: pIds} : {}),
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
            values={filters.servicePiloteIds}
            onChange={({services}) => {
              const {servicePiloteIds, ...rest} = filters;
              setFilters({
                ...rest,
                ...(services
                  ? {servicePiloteIds: services.map(s => s.id)}
                  : {}),
              });
            }}
          />
        </Field>
        <Field title="Thématique">
          <ThematiquesDropdown
            values={filters.thematiqueIds}
            onChange={({thematiques}) => {
              const {thematiqueIds, ...rest} = filters;
              setFilters({
                ...rest,
                ...(thematiques.length > 0
                  ? {thematiqueIds: thematiques.map(t => t.id)}
                  : {}),
              });
            }}
          />
        </Field>
      </FormSection>

      <FormSection title="Typologie :" className="!grid-cols-1">
        <Field title="Catégorie">
          <IndicateurCategoriesDropdown
            values={filters.categorieNoms}
            onChange={({categories}) => {
              const {categorieNoms, ...rest} = filters;
              setFilters({
                ...rest,
                ...(categories?.length > 0 ? {categorieNoms: categories} : {}),
              });
            }}
          />
        </Field>
        <Field title="Indicateur complété">
          <IndicateurCompletsDropdown
            values={
              filters.estComplet === undefined
                ? undefined
                : filters.estComplet
                ? 'rempli'
                : 'incomplet'
            }
            onChange={value => {
              const {estComplet, ...rest} = filters;
              setFilters({
                ...rest,
                ...(value
                  ? {
                      estComplet: value === 'rempli' ? true : false,
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
            const {participationScore, ...rest} = filters;
            setFilters({
              ...rest,
              ...(!participationScore ? {participationScore: true} : {}),
            });
          }}
        />
        <div className="w-full border-t border-primary-3" />
        <Checkbox
          label="Données Open Data"
          checked={filters.hasOpenData}
          onChange={() => {
            const {hasOpenData, ...rest} = filters;
            setFilters({
              ...rest,
              ...(!hasOpenData ? {hasOpenData: true} : {}),
            });
          }}
        />
        <Checkbox
          label="Indicateur privé"
          checked={filters.estConfidentiel}
          onChange={() => {
            const {estConfidentiel, ...rest} = filters;
            setFilters({
              ...rest,
              ...(!estConfidentiel ? {estConfidentiel: true} : {}),
            });
          }}
        />
        <Checkbox
          label="Indicateur personnalisé"
          checked={filters.estPerso}
          onChange={() => {
            const {estPerso, ...rest} = filters;
            setFilters({
              ...rest,
              ...(!estPerso ? {estPerso: true} : {}),
            });
          }}
        />
      </FormSection>
    </div>
  );
};

export default MenuFiltresTousLesIndicateurs;
