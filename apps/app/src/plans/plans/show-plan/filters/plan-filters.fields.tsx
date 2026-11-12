import { appLabels } from '@/app/labels/catalog';
import PrioritesFilterDropdown from '@/app/ui/dropdownLists/ficheAction/priorites/PrioritesFilterDropdown';
import StatutsFilterDropdown from '@/app/ui/dropdownLists/ficheAction/statuts/StatutsFilterDropdown';
import { TOption } from '@/app/ui/shared/select/commons';
import {
  EN_COURS_SANS_AVANCEMENT_LABEL,
  NON_MODIFIEE_DEPUIS_PLUS_D_UN_AN_LABEL,
  SANS_PILOTE_LABEL,
  SANS_REFERENT_LABEL,
} from '@tet/domain/plans';
import { Field, SelectFilter } from '@tet/ui';
import { capitalize } from '@tet/ui/labels/plural';
import {
  FormFilters,
  SuiviOption,
} from '../data/use-fiches-filters-list/types';

export type PlanFilterKey = Exclude<
  keyof FormFilters,
  'collectiviteId' | 'axes'
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
}: {
  filters: FormFilters;
  setFilters: (filters: FormFilters) => void;
  personneOptions: TOption[];
  hiddenKeys?: PlanFilterKey[];
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
      {!hiddenKeys.includes('suivi') && (
        <Field title={getFilterLabel('suivi')}>
          <SelectFilter
            values={filters.suivi ?? []}
            options={[
              EN_COURS_SANS_AVANCEMENT_LABEL,
              NON_MODIFIEE_DEPUIS_PLUS_D_UN_AN_LABEL,
            ].map((option) => ({ value: option, label: option }))}
            onChange={({ values }) =>
              setFilters({
                ...filters,
                suivi: Array.isArray(values) ? (values as SuiviOption[]) : [],
              })
            }
          />
        </Field>
      )}
    </>
  );
};
