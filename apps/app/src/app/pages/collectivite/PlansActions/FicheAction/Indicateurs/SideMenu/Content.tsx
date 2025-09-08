import {
  IndicateurDefinitionListItem,
  ListDefinitionsInputFilters,
  useListIndicateurDefinitions,
} from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Checkbox, Field, Input } from '@/ui';
import { useEffect, useState } from 'react';
import SelectIndicateursGrid from './SelectIndicateursGrid';

type Props = {
  selectedIndicateurs: IndicateurDefinitionListItem[] | null | undefined;
  onSelect: (indicateur: IndicateurDefinitionListItem) => void;
};

const Content = ({ selectedIndicateurs, onSelect }: Props) => {
  const [filters, setFilters] = useState<ListDefinitionsInputFilters>({});

  /** Texte de recherche pour l'input */
  const [search, setSearch] = useState<string>();

  /** Texte de recherche avec debounced pour l'appel */
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  const { data: { data: definitions } = {}, isPending: isDefinitionsLoading } =
    useListIndicateurDefinitions({
      filters: { ...filters, text: debouncedSearch },
    });

  const [selectedIndicateursState, setSelectedIndicateursState] =
    useState(selectedIndicateurs);

  useEffect(() => {
    setSelectedIndicateursState(selectedIndicateurs);
  }, [selectedIndicateurs]);

  return (
    <div className="p-4">
      <div className="relative flex flex-col gap-4">
        <Field title="Rechercher par nom ou description" small>
          <Input
            type="search"
            onSearch={(v) => setDebouncedSearch(v)}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            placeholder="Rechercher"
            displaySize="sm"
          />
        </Field>
        <Field title="Thématique" small>
          <ThematiquesDropdown
            values={filters.thematiqueIds}
            onChange={(thematiques) =>
              setFilters({
                ...filters,
                thematiqueIds: thematiques.length > 0 ? thematiques : undefined,
              })
            }
            small
            dropdownZindex={900}
          />
        </Field>
        <Checkbox
          label="Indicateur complété"
          checked={filters.estRempli ?? false}
          onChange={() =>
            setFilters({
              ...filters,
              estRempli: !filters.estRempli ? true : undefined,
            })
          }
        />
        <Checkbox
          label="Indicateur privé"
          checked={filters.estConfidentiel ?? false}
          onChange={() =>
            setFilters({
              ...filters,
              estConfidentiel: !filters.estConfidentiel ? true : undefined,
            })
          }
        />
        <Checkbox
          label="Indicateur personnalisé"
          checked={filters.estPerso}
          onChange={(event) =>
            setFilters({
              ...filters,
              estPerso: event.target.checked ?? undefined,
            })
          }
        />
        <Checkbox
          label="Indicateur de la collectivité"
          checked={filters.estFavori}
          onChange={(event) =>
            setFilters({
              ...filters,
              estFavori: event.target.checked ?? undefined,
            })
          }
        />
      </div>
      <hr className="p-0 my-6 w-full h-px" />
      <div className="mb-4 font-bold">
        {selectedIndicateursState ? (
          <>
            {selectedIndicateursState.length} indicateur
            {selectedIndicateursState.length > 1 && 's'} sélectionné
            {selectedIndicateursState.length > 1 && 's'}
          </>
        ) : (
          <>0 indicateur sélectionné</>
        )}
      </div>
      <SelectIndicateursGrid
        definitions={definitions}
        isLoading={isDefinitionsLoading}
        selectedIndicateurs={selectedIndicateursState}
        onSelect={onSelect}
      />
    </div>
  );
};

export default Content;
