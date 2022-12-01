import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import HistoriqueFiltreField from './HistoriqueFiltreField';

import {useCollectiviteMembres} from 'app/pages/collectivite/Users/useCollectiviteMembres';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/select/commons';
import {TFiltreProps} from '../filters';

const FiltreMembre = ({filters, setFilters}: TFiltreProps) => {
  const {membres} = useCollectiviteMembres();

  // Tableau d'options pour le multi-select
  const memberList: {value: string; label: string}[] = [];
  // Ajoute l'option "Tous" s'il y a plus d'une option
  if (membres.length > 1) {
    memberList.push({value: ITEM_ALL, label: 'Tous'});
  }
  // Transformation des données membres en options pour le multi-select
  membres
    .filter(m => m.user_id)
    .map(m =>
      memberList.push({
        value: m.user_id!,
        label: `${m.prenom} ${m.nom}`,
      })
    );

  return (
    <HistoriqueFiltreField title="Membre de la collectivité">
      <MultiSelectFilter
        data-test="filtre-membre"
        values={
          filters.modified_by && getIsAllSelected(filters.modified_by)
            ? undefined
            : filters.modified_by
        }
        options={memberList}
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
