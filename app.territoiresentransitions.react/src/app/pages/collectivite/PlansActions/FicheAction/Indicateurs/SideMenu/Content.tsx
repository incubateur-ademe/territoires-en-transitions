import {useEffect, useState} from 'react';

import {Indicateurs} from '@tet/api';
import {Checkbox, Field, Input} from '@tet/ui';

import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import SelectIndicateursGrid from './SelectIndicateursGrid';
import {TIndicateurListItem} from 'app/pages/collectivite/Indicateurs/types';
import ThematiquesDropdown from 'ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';

type Props = {
  selectedIndicateurs: TIndicateurListItem[] | null;
  onSelect: (indicateur: TIndicateurListItem) => void;
};

const Content = ({selectedIndicateurs, onSelect}: Props) => {
  const [filters, setFilters] = useState<Indicateurs.FetchFiltre>({});

  const {data: definitions, isLoading: isDefinitionsLoading} =
    useFilteredIndicateurDefinitions({filtre: filters});

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
            onSearch={text => setFilters({...filters, text})}
            placeholder="Rechercher"
            displaySize="sm"
          />
        </Field>
        <Field title="Thématique" small>
          <ThematiquesDropdown
            values={filters.thematiqueIds}
            onChange={({thematiques}) =>
              setFilters({
                ...filters,
                thematiqueIds:
                  thematiques.length > 0
                    ? thematiques.map(t => t.id)
                    : undefined,
              })
            }
            small
            dropdownZindex={900}
          />
        </Field>
        <Checkbox
          label="Indicateur complété"
          checked={filters.estComplet ?? false}
          onChange={() =>
            setFilters({
              ...filters,
              estComplet: !filters.estComplet ? true : undefined,
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
          onChange={event =>
            setFilters({
              ...filters,
              estPerso: event.target.checked ?? undefined,
            })
          }
        />
        <Checkbox
          label="Indicateur de la collectivité"
          checked={filters.estFavorisCollectivite}
          onChange={event =>
            setFilters({
              ...filters,
              estFavorisCollectivite: event.target.checked ?? undefined,
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
