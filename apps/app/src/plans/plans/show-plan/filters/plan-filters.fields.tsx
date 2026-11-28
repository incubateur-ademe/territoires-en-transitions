import { appLabels } from '@/app/labels/catalog';
import { SousActionsScopeField } from '@/app/plans/fiches/list-all-fiches/sous-actions-scope/sous-actions-scope.field';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import { TOption } from '@/app/ui/shared/select/commons';
import { SANS_PILOTE_LABEL, SANS_REFERENT_LABEL } from '@tet/domain/plans';
import { Field, SelectFilter } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import { FormFilters } from '../data/use-fiches-filters-list/types';

export type PlanFilterKey = Exclude<
  keyof FormFilters,
  'collectiviteId' | 'axes' | 'withSousActionsMatches'
>;

export const planFilterLabels: Record<PlanFilterKey, string> = {
  priorites: capitalize(appLabels.niveauPriorite),
  statuts: capitalize(appLabels.ficheStatut),
  referents: appLabels.personneElue(),
  pilotes: appLabels.personnePilote(),
  suivi: appLabels.planFiltreSuivi,
};

export const PlanFiltersFields = ({
  filters,
  setFilters,
  personneOptions,
  hiddenKeys = [],
  showsSousActionsScope = false,
}: {
  filters: FormFilters;
  setFilters: (filters: FormFilters) => void;
  personneOptions: TOption[];
  hiddenKeys?: PlanFilterKey[];
  /** Affiche le périmètre « Actions uniquement / Actions et sous-actions » */
  showsSousActionsScope?: boolean;
}) => {
  const getFilterLabel = (key: PlanFilterKey) => planFilterLabels[key];
  return (
    <>
      {!hiddenKeys.includes('pilotes') && (
        <Field title={getFilterLabel('pilotes')}>
          <SelectFilter
            values={filters.pilotes ?? []}
            options={[
              {
                value: SANS_PILOTE_LABEL,
                label: SANS_PILOTE_LABEL,
              },
              ...personneOptions,
            ]}
            onChange={({ values }) =>
              setFilters({
                ...filters,
                pilotes: Array.isArray(values) ? (values as string[]) : [],
              })
            }
            disabled={personneOptions.length === 0}
            isSearcheable
          />
        </Field>
      )}
      {!hiddenKeys.includes('statuts') && (
        <Field title={getFilterLabel('statuts')}>
          <StatutsFilterDropdown
            values={filters.statuts}
            onChange={(statuts) =>
              setFilters({
                ...filters,
                statuts,
              })
            }
          />
        </Field>
      )}
      {!hiddenKeys.includes('referents') && (
        <Field title={getFilterLabel('referents')}>
          <SelectFilter
            values={filters.referents ?? []}
            options={[
              {
                value: SANS_REFERENT_LABEL,
                label: SANS_REFERENT_LABEL,
              },
              ...personneOptions,
            ]}
            onChange={({ values }) =>
              setFilters({
                ...filters,
                referents: Array.isArray(values) ? (values as string[]) : [],
              })
            }
            disabled={personneOptions.length === 0}
            isSearcheable
          />
        </Field>
      )}
      {!hiddenKeys.includes('priorites') && (
        <Field title={getFilterLabel('priorites')}>
          <PrioritesFilterDropdown
            values={filters.priorites}
            onChange={(priorites) => setFilters({ ...filters, priorites })}
          />
        </Field>
      )}
      {showsSousActionsScope && (
        <SousActionsScopeField
          withSousActionsMatches={!!filters.withSousActionsMatches}
          onChange={(withSousActionsMatches) =>
            setFilters({
              ...filters,
              withSousActionsMatches: withSousActionsMatches || undefined,
            })
          }
        />
      )}
    </>
  );
};
