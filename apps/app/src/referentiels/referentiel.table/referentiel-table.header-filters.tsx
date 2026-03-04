import { avancementToLabel } from '@/app/app/labels';
import PersonneTagDropdown from '@/app/collectivites/tags/personne-tag.dropdown';
import { getPersonneStringId } from '@/app/collectivites/tags/personnes.utils';
import ServiceTagDropdown from '@/app/collectivites/tags/service-tag.dropdown';
import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import {
  ActionCategorieEnum,
  StatutAvancement,
  StatutAvancementCreate,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { Input, SelectFilter } from '@tet/ui';
import { useState } from 'react';
import { Z_INDEX_ABOVE_STICKY_HEADER } from '../../ui/layout/HeaderSticky';
import { categorieToLabel } from '../utils';
import { scoreRangeItems } from './referentiel-table.score-ranges';
import { useGetReferentielTableFiltersState } from './use-get-referentiel-table-filters-state';

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

const categorieOptions = [
  ActionCategorieEnum.BASES,
  ActionCategorieEnum.MISE_EN_OEUVRE,
  ActionCategorieEnum.EFFETS,
].map((value) => ({
  value,
  label: categorieToLabel[value],
}));

type FiltersState = Pick<
  ReturnType<typeof useGetReferentielTableFiltersState>,
  'filters' | 'setFilters'
>;

export const IntituleHeaderFilter = ({ filters, setFilters }: FiltersState) => {
  const [searchText, setSearchText] = useState(filters.identifiantAndTitre);
  return (
    <Input
      type="search"
      displaySize="sm"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      onSearch={(value) => setFilters({ identifiantAndTitre: value })}
      placeholder="Rechercher par identifiant ou mot-clé"
      containerClassname="w-full"
      icon={undefined}
    />
  );
};

export const ExplicationHeaderFilter = ({
  filters,
  setFilters,
}: FiltersState) => {
  const [searchText, setSearchText] = useState(filters.explication);
  return (
    <Input
      type="search"
      displaySize="sm"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      onSearch={(value) => setFilters({ explication: value })}
      placeholder="Rechercher un mot-clé"
      containerClassname="w-full"
      icon={undefined}
    />
  );
};

export const CategorieHeaderFilter = ({
  filters,
  setFilters,
}: FiltersState) => (
  <SelectFilter
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    options={categorieOptions}
    values={filters.categories}
    onChange={({ values }) =>
      setFilters({ categories: (values ?? []) as string[] })
    }
    placeholder="Filtrer"
    small
    containerWidthMatchButton={false}
  />
);

export const StatutHeaderFilter = ({ filters, setFilters }: FiltersState) => (
  <SelectFilter
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    options={statutOptions}
    values={filters.statuts}
    onChange={({ values }) =>
      setFilters({ statuts: (values ?? []) as StatutAvancement[] })
    }
    placeholder="Filtrer"
    small
    containerWidthMatchButton={false}
    customItem={(item) => (
      <ActionStatutBadge statut={item.value as StatutAvancementCreate} />
    )}
  />
);

type ScoreRangeFilterKey = 'scoreRealise' | 'scoreProgramme' | 'scorePasFait';

export const ScoreRangeHeaderFilter = ({
  filters,
  setFilters,
  filterKey,
}: FiltersState & { filterKey: ScoreRangeFilterKey }) => (
  <SelectFilter
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    options={scoreRangeItems}
    values={filters[filterKey]}
    onChange={({ values }) =>
      setFilters({ [filterKey]: (values ?? []) as string[] })
    }
    placeholder="Filtrer"
    small
    containerWidthMatchButton={false}
  />
);

export const PilotesHeaderFilter = ({ filters, setFilters }: FiltersState) => (
  <PersonneTagDropdown
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    values={filters.pilotes}
    onChange={({ personnes }) =>
      setFilters({
        pilotes: personnes.map((p) => getPersonneStringId(p)),
      })
    }
    placeholder="Filtrer"
    disableEdition={true}
    isSearcheable={false}
    containerWidthMatchButton={false}
    small
  />
);

export const ServicesHeaderFilter = ({ filters, setFilters }: FiltersState) => (
  <ServiceTagDropdown
    dropdownZindex={Z_INDEX_ABOVE_STICKY_HEADER}
    values={filters.services}
    onChange={({ values }) => setFilters({ services: values.map((s) => s.id) })}
    placeholder="Filtrer"
    disableEdition={true}
    containerWidthMatchButton={false}
    small
  />
);
