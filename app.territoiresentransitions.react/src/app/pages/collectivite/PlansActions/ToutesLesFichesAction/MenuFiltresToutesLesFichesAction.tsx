import {Checkbox, Field, FormSection, FormSectionGrid} from '@tet/ui';
import PersonnesDropdown from 'ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {Filtre} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {
  getPilotesValues,
  getReferentsValues,
  splitPilotePersonnesAndUsers,
  splitReferentPersonnesAndUsers,
} from 'ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from 'ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import FinanceursDropdown from 'ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import StatutsFilterDropdown from 'ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import PrioritesFilterDropdown from 'ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';

type Props = {
  filters: Filtre;
  setFilters: (filters: Filtre) => void;
};

const MenuFiltresToutesLesFichesAction = ({filters, setFilters}: Props) => {
  const pilotes = getPilotesValues(filters);
  const referents = getReferentsValues(filters);

  return (
    <div className="w-80 flex flex-col gap-8">
      <FormSection title="Nouveau filtre :" className="!grid-cols-1">
        <Field title="Personne pilote">
          <PersonnesDropdown
            values={pilotes}
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
                ...(services ? {servicePiloteIds: services} : {}),
              });
            }}
          />
        </Field>

        <Field title="Élu·e référent·e">
          <PersonnesDropdown
            values={referents}
            onChange={({personnes}) => {
              const {personneReferenteIds, utilisateurReferentIds, ...rest} =
                filters;
              const {personneReferenteIds: pIds, utilisateurReferentIds: uIds} =
                splitReferentPersonnesAndUsers(personnes);
              setFilters({
                ...rest,
                ...(pIds.length > 0 ? {personneReferenteIds: pIds} : {}),
                ...(uIds.length > 0
                  ? {
                      utilisateurReferentIds: uIds,
                    }
                  : {}),
              });
            }}
          />
        </Field>

        <FormSectionGrid>
          <Field title="Statut de l'action">
            <StatutsFilterDropdown
              values={filters.statuts}
              onChange={({statuts}) => {
                const {statuts: st, ...rest} = filters;
                setFilters({
                  ...rest,
                  ...(statuts ? {statuts} : {}),
                });
              }}
            />
          </Field>
          <Field title="Niveau de priorité">
            <PrioritesFilterDropdown
              values={filters.priorites}
              onChange={({priorites}) => {
                const {priorites: st, ...rest} = filters;
                setFilters({
                  ...rest,
                  ...(priorites ? {priorites} : {}),
                });
              }}
            />
          </Field>
        </FormSectionGrid>
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
        <Field title="Financeur">
          <FinanceursDropdown
            values={filters.financeurIds}
            onChange={({financeurs}) => {
              const {financeurIds, ...rest} = filters;
              setFilters({
                ...rest,
                ...(financeurs ? {financeurIds: financeurs} : {}),
              });
            }}
          />
        </Field>
      </FormSection>

      <Checkbox
        label="Budget prévisionnel total renseigné"
        checked={filters.budgetPrevisionnel}
        onChange={() => {
          const {budgetPrevisionnel, ...rest} = filters;
          setFilters({
            ...rest,
            ...(!budgetPrevisionnel ? {budgetPrevisionnel: true} : {}),
          });
        }}
      />
      <Checkbox
        label="Fiche action en mode privé"
        checked={filters.restreint}
        onChange={() => {
          const {restreint, ...rest} = filters;
          setFilters({
            ...rest,
            ...(!restreint ? {restreint: true} : {}),
          });
        }}
      />
      <Checkbox
        label="Indicateur(s) lié(s)"
        checked={filters.hasIndicateurLies}
        onChange={() => {
          const {hasIndicateurLies, ...rest} = filters;
          setFilters({
            ...rest,
            ...(!hasIndicateurLies ? {hasIndicateurLies: true} : {}),
          });
        }}
      />
    </div>
  );
};

export default MenuFiltresToutesLesFichesAction;
