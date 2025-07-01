import { StatutsFilter } from './Statuts';

import {
  SANS_PILOTE_LABEL,
  SANS_REFERENT_LABEL,
} from '@/backend/plans/fiches/shared/labels';
import { Field, SelectFilter } from '@/ui';
import { filterLabels } from '../../data/use-fiches-filters-list/types';
import { usePlanFilters } from '../plan-filters.context';
import FiltrePriorites from './Priorites';

export const Menu = () => {
  const { filters, setFilters, personneOptions } = usePlanFilters();

  return (
    <div className="flex flex-col gap-4">
      <Field title={filterLabels.pilotes}>
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
      <StatutsFilter
        values={filters.statuts ?? []}
        onChange={(statuts) =>
          setFilters({
            ...filters,
            statuts,
          })
        }
      />
      <Field title={filterLabels.referents}>
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
      <FiltrePriorites
        values={filters.priorites ?? []}
        onChange={(priorites) => setFilters({ ...filters, priorites })}
      />
    </div>
  );
};
