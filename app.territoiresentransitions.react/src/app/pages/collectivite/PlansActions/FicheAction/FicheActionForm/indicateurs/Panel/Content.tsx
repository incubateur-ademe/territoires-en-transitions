import {useState} from 'react';

import {Indicateurs} from '@tet/api';
import {Checkbox, Field, Input, SelectFilter} from '@tet/ui';

import {useThematiqueListe} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/useThematiqueListe';
import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import SelectIndicateursGrid from './SelectIndicateursGrid';
import {Indicateur} from 'app/pages/collectivite/Indicateurs/types';

type Props = {
  selectedIndicateurs: Indicateur[] | null;
  onSelect: (indicateurs: Indicateur[]) => void;
};

const Content = ({selectedIndicateurs, onSelect}: Props) => {
  const {data: thematiqueListe} = useThematiqueListe();

  const [filters, setFilters] = useState<Indicateurs.Filters>({});

  const {data: definitions} = useFilteredIndicateurDefinitions(null, filters);

  const [selectedIndicateursState, setSelectedIndicateursState] =
    useState(selectedIndicateurs);

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
          <SelectFilter
            options={
              thematiqueListe?.map(t => ({label: t.nom, value: t.id})) ?? []
            }
            values={filters.thematique_ids}
            onChange={({values}) =>
              setFilters({
                ...filters,
                thematique_ids: values as number[],
              })
            }
            small
          />
        </Field>
        <Checkbox
          label="Indicateur complété"
          checked={filters.rempli ?? false}
          onChange={() => setFilters({...filters, rempli: !filters.rempli})}
        />
        <Checkbox
          label="Indicateur privé"
          checked={filters.confidentiel ?? false}
          onChange={() =>
            setFilters({...filters, confidentiel: !filters.confidentiel})
          }
        />
      </div>
      <hr className="p-0 my-6 w-full h-px" />
      <div className="mb-6 font-bold">
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
      {definitions && definitions.length > 0 ? (
        <SelectIndicateursGrid
          definitions={definitions}
          selectedIndicateurs={selectedIndicateursState}
          onSelect={handleSelect}
        />
      ) : (
        <div className="my-24 text-center text-sm text-grey-6">
          Aucun indicateur
          <br /> ne correspond à votre recherche
        </div>
      )}
    </div>
  );
};

export default Content;
