import {useState} from 'react';

import {Indicateurs} from '@tet/api';
import {Checkbox, Field, Input, SelectFilter} from '@tet/ui';

import {useThematiqueListe} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/useThematiqueListe';
import {useFilteredIndicateurDefinitions} from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import IndicateurChartsGrid from './IndicateurChartsGrid';

const Content = () => {
  const {data: thematiqueListe} = useThematiqueListe();

  const [filters, setFilters] = useState<Indicateurs.Filters>({});

  const {data: definitions} = useFilteredIndicateurDefinitions(null, filters);

  return (
    <div className="grow p-4 overflow-y-auto">
      <div className="flex flex-col gap-4">
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
        {/* <Field title="Indicateur complété" small>
          <SelectFilter
            options={[
              {value: 'oui', label: 'Complété'},
              {value: 'non', label: 'À compléter'},
            ]}
            values={filters.rempli ? 'oui' : 'non'}
            onChange={() => null}
            small
          />
        </Field> */}
        <Checkbox
          label="Indicateur complété"
          checked={filters.rempli}
          onChange={() => setFilters({...filters, rempli: !filters.rempli})}
        />
        <Checkbox
          label="Indicateur privé"
          checked={filters.confidentiel}
          onChange={() =>
            setFilters({...filters, confidentiel: !filters.confidentiel})
          }
        />
      </div>
      <hr className="p-0 my-8 w-full h-px" />
      <div className="mb-6 font-bold text-lg">X indicateur sélectionné</div>
      {definitions && <IndicateurChartsGrid definitions={definitions} />}
    </div>
  );
};

export default Content;
