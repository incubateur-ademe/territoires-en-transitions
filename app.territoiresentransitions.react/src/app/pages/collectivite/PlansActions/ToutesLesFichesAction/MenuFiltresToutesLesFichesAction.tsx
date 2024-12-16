import { Filtre } from '@/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import FinanceursDropdown from '@/app/ui/dropdownLists/FinanceursDropdown/FinanceursDropdown';
import PartenairesDropdown from '@/app/ui/dropdownLists/PartenairesDropdown/PartenairesDropdown';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import {
  getPilotesValues,
  getReferentsValues,
  splitPilotePersonnesAndUsers,
  splitReferentPersonnesAndUsers,
} from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import PlansActionDropdown from '@/app/ui/dropdownLists/PlansActionDropdown';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import StructuresDropdown from '@/app/ui/dropdownLists/StructuresDropdown/StructuresDropdown';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import CiblesDropdown from '@/app/ui/dropdownLists/ficheAction/CiblesDropdown/CiblesDropdown';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import { Checkbox, Field, FormSection, useEventTracker } from '@/ui';

type Props = {
  filters: Filtre;
  setFilters: (filters: Filtre) => void;
  collectiviteId: number;
};

const MenuFiltresToutesLesFichesAction = ({
  filters,
  setFilters,
  collectiviteId,
}: Props) => {
  const tracker = useEventTracker('app/toutes-les-fiches-action');
  const pilotes = getPilotesValues(filters);
  const referents = getReferentsValues(filters);

  return (
    <div className="w-96 md:w-[48rem] p-4 lg:p-8">
      <FormSection
        title="Nouveau filtre :"
        className="!grid-cols-1 md:!grid-cols-2 gap-x-8"
      >
        <div className="*:mb-4 first:!mb-0">
          <Field title="Plans d'action">
            <PlansActionDropdown
              values={filters.planActionIds}
              onChange={({ plans }) => {
                const { planActionIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(plans ? { planActionIds: plans } : {}),
                });
                tracker('filtre_plan_action_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>

          <Field title="Personne pilote">
            <PersonnesDropdown
              values={pilotes}
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
                tracker('filtre_personne_pilote_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>

          <Field title="Direction ou service pilote">
            <ServicesPilotesDropdown
              values={filters.servicePiloteIds}
              onChange={({ services }) => {
                const { servicePiloteIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(services
                    ? { servicePiloteIds: services.map((s) => s.id) }
                    : {}),
                });
                tracker('filtre_direction_pilote_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>

          <Field title="Structure pilote">
            <StructuresDropdown
              values={filters.structurePiloteIds}
              onChange={({ structures }) => {
                const { structurePiloteIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(structures
                    ? { structurePiloteIds: structures.map((s) => s.id) }
                    : {}),
                });
                tracker('filtre_structure_pilote_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>

          <Field title="Élu·e référent·e">
            <PersonnesDropdown
              values={referents}
              onChange={({ personnes }) => {
                const {
                  personneReferenteIds,
                  utilisateurReferentIds,
                  ...rest
                } = filters;
                const {
                  personneReferenteIds: pIds,
                  utilisateurReferentIds: uIds,
                } = splitReferentPersonnesAndUsers(personnes);
                setFilters({
                  ...rest,
                  ...(pIds.length > 0 ? { personneReferenteIds: pIds } : {}),
                  ...(uIds.length > 0
                    ? {
                        utilisateurReferentIds: uIds,
                      }
                    : {}),
                });
                tracker('filtre_elu_referent_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
          <div className="flex flex-col gap-4 !mt-6">
            <Checkbox
              label="Budget prévisionnel total renseigné"
              checked={filters.budgetPrevisionnel}
              onChange={() => {
                const { budgetPrevisionnel, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!budgetPrevisionnel ? { budgetPrevisionnel: true } : {}),
                });
                tracker('filtre_budge_previsionnel_total_renseigne_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            <Checkbox
              label="Fiche action en mode privé"
              checked={filters.restreint}
              onChange={() => {
                const { restreint, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!restreint ? { restreint: true } : {}),
                });
                tracker('filtre_mode_prive_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            <Checkbox
              label="L'action se répète tous les ans"
              checked={filters.ameliorationContinue}
              onChange={() => {
                const { ameliorationContinue, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!ameliorationContinue
                    ? { ameliorationContinue: true }
                    : {}),
                });
                tracker('filtre_action_se_repete_ans_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            <Checkbox
              label="Indicateur(s) associé(s)"
              checked={filters.hasIndicateurLies}
              onChange={() => {
                const { hasIndicateurLies, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!hasIndicateurLies ? { hasIndicateurLies: true } : {}),
                });
                tracker('filtre_indicateurs_associes_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            <Checkbox
              label="Sans pilote"
              checked={filters.sansPilote}
              onChange={() => {
                const { sansPilote, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!sansPilote ? { sansPilote: true } : {}),
                });
                tracker('filtre_sans_pilote_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            <Checkbox
              label="Sans direction ou service pilote"
              checked={filters.sansServicePilote}
              onChange={() => {
                const { sansServicePilote, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!sansServicePilote ? { sansServicePilote: true } : {}),
                });
                tracker('filtre_sans_direction_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
            <Checkbox
              label="Sans statut"
              checked={filters.sansStatut}
              onChange={() => {
                const { sansStatut, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(!sansStatut ? { sansStatut: true } : {}),
                });
                tracker('filtre_sans_statut_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </div>
        </div>

        <div className="*:mb-4 first:!mb-0">
          <Field title="Statut de l'action">
            <StatutsFilterDropdown
              values={filters.statuts}
              onChange={({ statuts }) => {
                const { statuts: st, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(statuts ? { statuts } : {}),
                });
                tracker('filtre_statut_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
          <Field title="Niveau de priorité">
            <PrioritesFilterDropdown
              values={filters.priorites}
              onChange={({ priorites }) => {
                const { priorites: prio, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(priorites ? { priorites } : {}),
                });
                tracker('filtre_niveau_priorite_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
          <Field title="Thématique">
            <ThematiquesDropdown
              values={filters.thematiqueIds}
              onChange={({ thematiques }) => {
                const { thematiqueIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(thematiques.length > 0
                    ? { thematiqueIds: thematiques.map((t) => t.id) }
                    : {}),
                });
                tracker('filtre_thematique_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
          <Field title="Financeur">
            <FinanceursDropdown
              values={filters.financeurIds}
              onChange={({ financeurs }) => {
                const { financeurIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(financeurs
                    ? { financeurIds: financeurs.map((f) => f.id!) }
                    : {}),
                });
                tracker('filtre_financeur_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
          <Field title="Partenaires">
            <PartenairesDropdown
              values={filters.partenaireIds}
              onChange={({ partenaires }) => {
                const { partenaireIds, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(partenaires
                    ? { partenaireIds: partenaires.map((p) => p.id) }
                    : {}),
                });
                tracker('filtre_partenaires_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
          <Field title="Cibles">
            <CiblesDropdown
              values={filters.cibles}
              onChange={({ cibles: newCibles }) => {
                const { cibles, ...rest } = filters;
                setFilters({
                  ...rest,
                  ...(newCibles ? { cibles: newCibles.map((c) => c) } : {}),
                });
                tracker('filtre_cibles_fa', {
                  collectivite_id: collectiviteId!,
                });
              }}
            />
          </Field>
        </div>
      </FormSection>
    </div>
  );
};

export default MenuFiltresToutesLesFichesAction;
