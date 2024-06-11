import {useEffect, useState} from 'react';

import {Indicateurs} from '@tet/api';
import {Checkbox, Field, Input} from '@tet/ui';

import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import SelectIndicateursGrid from './SelectIndicateursGrid';
import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';
import ThematiquesDropdown from 'ui/DropdownListsTemp/ThematiquesDropdown/ThematiquesDropdown';

type Props = {
  selectedIndicateurs: Indicateur[] | null;
  onSelect: (indicateurs: Indicateur[]) => void;
};

const Content = ({selectedIndicateurs, onSelect}: Props) => {
  const [filters, setFilters] = useState<Indicateurs.Filters>({});

  const [subset, setSubset] = useState<Indicateurs.Subset | null>(null);

  const {data: definitions, isLoading: isDefinitionsLoading} =
    useFilteredIndicateurDefinitions(subset, filters);

  const [selectedIndicateursState, setSelectedIndicateursState] =
    useState(selectedIndicateurs);

  useEffect(() => {
    setSelectedIndicateursState(selectedIndicateurs);
  }, [selectedIndicateurs]);

  const handleSelect = (indicateurs: Indicateur[]) => {
    setSelectedIndicateursState(indicateurs);
    onSelect(indicateurs);
  };

  return (
    <div className="grow p-4 overflow-y-auto">
      <div className=" relative flex flex-col gap-4 z-[1]">
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
            values={filters.thematique_ids ?? undefined}
            onChange={thematiques =>
              setFilters({
                ...filters,
                thematique_ids:
                  thematiques.length > 0
                    ? thematiques.map(t => t.id)
                    : undefined,
              })
            }
            small
          />
        </Field>
        <Checkbox
          label="Indicateur complété"
          checked={filters.rempli ?? false}
          onChange={() =>
            setFilters({...filters, rempli: !filters.rempli ? true : undefined})
          }
        />
        <Checkbox
          label="Indicateur privé"
          checked={filters.confidentiel ?? false}
          onChange={() =>
            setFilters({
              ...filters,
              confidentiel: !filters.confidentiel ? true : undefined,
            })
          }
        />
        <Checkbox
          label="Indicateur personnalisé"
          checked={subset === 'perso' ?? false}
          onChange={() => setSubset(subset === 'perso' ? null : 'perso')}
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
        onSelect={handleSelect}
      />
    </div>
  );
};

export default Content;
