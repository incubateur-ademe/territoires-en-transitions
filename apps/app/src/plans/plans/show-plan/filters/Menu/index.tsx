import { StatutsDropdown } from './status.dropdown';

import { SANS_PILOTE_LABEL, SANS_REFERENT_LABEL } from '@tet/domain/plans';
import { Alert, Field, SelectFilter } from '@tet/ui';
import { usePlanFilters } from '../plan-filters.context';
import { PrioriteDropdown } from './priorites.dropdown';

export const Menu = () => {
  const { filters, setFilters, personneOptions, getFilterLabel } =
    usePlanFilters();

  return (
    <div className="flex flex-col gap-4">
      <Alert title="Les filtres s'appliquent uniquement sur les actions" />
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
      <StatutsDropdown
        title={getFilterLabel('statuts')}
        values={filters.statuts ?? []}
        onChange={(statuts) =>
          setFilters({
            ...filters,
            statuts,
          })
        }
      />
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
      <PrioriteDropdown
        title={getFilterLabel('priorites')}
        values={filters.priorites ?? []}
        onChange={(priorites) => setFilters({ ...filters, priorites })}
      />
    </div>
  );
};
