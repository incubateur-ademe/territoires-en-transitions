import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import HistoriqueFiltreField from './HistoriqueFiltreField';

import {useCollectiviteMembres} from 'app/pages/collectivite/Users/useCollectiviteMembres';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/select/commons';
import {TFiltreProps} from '../filters';

const FiltreMembre = ({filters, setFilters}: TFiltreProps) => {
  const {membres} = useCollectiviteMembres();

  const collectiviteMemberList = [
    {value: ITEM_ALL, label: 'Tous'},
    ...membres.map(m => ({
      value: m.user_id!,
      label: `${m.prenom} ${m.nom}`,
    })),
  ];

  return (
    <HistoriqueFiltreField title="Membre de la collectivité">
      <MultiSelectFilter
        values={
          filters.modified_by && getIsAllSelected(filters.modified_by)
            ? undefined
            : filters.modified_by
        }
        options={collectiviteMemberList}
        onSelect={newValues =>
          setFilters({
            ...filters,
            modified_by: newValues,
          })
        }
        placeholderText="Sélectionner des options"
      />
    </HistoriqueFiltreField>
  );
};

export default FiltreMembre;
