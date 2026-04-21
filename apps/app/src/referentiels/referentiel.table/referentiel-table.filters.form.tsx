import { avancementToLabel } from '@/app/app/labels';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import PersonnesDropdown from '@/app/ui/dropdownLists/PersonnesDropdown/PersonnesDropdown';
import { getPersonneStringId } from '@/app/ui/dropdownLists/PersonnesDropdown/utils';
import ServicesPilotesDropdown from '@/app/ui/dropdownLists/ServicesPilotesDropdown/ServicesPilotesDropdown';
import {
  StatutAvancement,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { Input, SelectFilter, SelectMultiple } from '@tet/ui';
import { useState } from 'react';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '../../ui/layout/HeaderSticky';
import { useGetReferentielTableFiltersState } from './use-get-referentiel-table-filters-state';
import {
  ReferentielTableColumnOption,
  useReferentielTableColumnVisibility,
} from './use-referentiel-table-column-visibility';

const statutOptions = (
  [
    StatutAvancementEnum.NON_RENSEIGNE,
    StatutAvancementEnum.FAIT,
    StatutAvancementEnum.PAS_FAIT,
    StatutAvancementEnum.PROGRAMME,
    StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
    StatutAvancementEnum.DETAILLE_A_LA_TACHE,
    StatutAvancementEnum.NON_CONCERNE,
  ] as StatutAvancementCreate[]
).map((value) => ({
  value,
  label: avancementToLabel[value],
}));

export function ReferentielTableFiltersForm({
  filtersState: { filters, setFilters },
  columnVisibility: { visibleColumnIds, setVisibleColumnIds, columnOptions },
}: {
  filtersState: ReturnType<typeof useGetReferentielTableFiltersState>;
  columnVisibility: ReturnType<typeof useReferentielTableColumnVisibility>;
}) {
  const [searchText, setSearchText] = useState(filters.text);

  const visibilityOptions = columnOptions.map(
    (option: ReferentielTableColumnOption) => ({
      value: option.id,
      label: option.label,
    })
  );

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className=" min-w-96">
        <Input
          type="search"
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(value) => setFilters({ text: value })}
          placeholder="Rechercher par identifiant, intitulé ou avancement"
          displaySize="sm"
          value={searchText}
          containerClassname="w-full"
        />
      </div>

      <div className="w-56">
        <SelectFilter
          dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
          options={statutOptions}
          values={filters.statuts}
          onChange={({ values }) =>
            setFilters({ statuts: (values ?? []) as StatutAvancement[] })
          }
          placeholder="Statut"
          small
          customItem={(item) => (
            <ActionStatutBadge statut={item.value as StatutAvancementCreate} />
          )}
        />
      </div>

      <div className="w-52">
        <PersonnesDropdown
          dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
          values={filters.pilotes}
          onChange={({ personnes }) =>
            setFilters({
              pilotes: personnes.map((p) => getPersonneStringId(p)),
            })
          }
          placeholder="Pilotes"
          small
        />
      </div>

      <div className="w-52">
        <ServicesPilotesDropdown
          dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
          values={filters.services}
          onChange={({ services }) =>
            setFilters({ services: services.map((s) => s.id) })
          }
          placeholder="Services pilotes"
          small
        />
      </div>

      <div className="w-56 ml-auto">
        <SelectMultiple
          dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
          options={visibilityOptions}
          values={visibleColumnIds}
          onChange={({ values }) =>
            setVisibleColumnIds((values ?? []) as string[])
          }
          isSearcheable
          placeholder="Colonnes"
          small
        />
      </div>
    </div>
  );
}
