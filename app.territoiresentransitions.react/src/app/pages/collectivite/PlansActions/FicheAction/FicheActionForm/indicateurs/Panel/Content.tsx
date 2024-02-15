import {useState} from 'react';
import {useQuery} from 'react-query';

import {Indicateurs} from '@tet/api';
import {Checkbox, Field, Input, SelectFilter} from '@tet/ui';

import {useThematiqueListe} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/useThematiqueListe';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {supabaseClient} from 'core-logic/api/supabase';

const Content = () => {
  const collectivite_id = useCollectiviteId();

  const {data: thematiqueListe} = useThematiqueListe();

  const [search, setSearch] = useState('');

  const [subset, setSubset] = useState<Indicateurs.Subset>('selection');

  const [filters, setFilters] = useState<Indicateurs.Filters>({});

  const data = useQuery(
    ['indicateur_definitions', collectivite_id, subset, filters],
    async () => {
      if (!collectivite_id) return [];
      const {data, error} = await Indicateurs.fetchFilteredIndicateurs(
        supabaseClient,
        collectivite_id,
        subset,
        filters
      );

      if (error) {
        throw new Error(error.message);
      }

      return (
        data
          // tri par nom (pour que les diacritiques soient pris en compte)
          ?.sort((a, b) => (a.nom && b.nom ? a.nom.localeCompare(b.nom) : 0))
      );
    }
  );

  console.log(data.data);
  return (
    <div className="grow p-4 overflow-y-auto">
      <div className="flex flex-col gap-4">
        <Field title="Rechercher par nom ou description" small>
          <Input
            type="search"
            onChange={e => setSearch(e.target.value)}
            onSearch={v => null}
            value={search}
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
      <div className="flex flex-col gap-6">
        <div className="h-64 bg-primary-1" />
        <div className="h-64 bg-primary-1" />
      </div>
    </div>
  );
};

export default Content;
