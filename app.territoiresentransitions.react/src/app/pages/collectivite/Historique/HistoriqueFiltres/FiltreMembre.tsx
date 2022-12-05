import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import HistoriqueFiltreField from './HistoriqueFiltreField';

import {getIsAllSelected, ITEM_ALL} from 'ui/shared/select/commons';
import {TFiltreProps} from '../filters';
import {useHistoriqueUtilisateurListe} from '../useHistoriqueUtilisateurListe';
import {useCollectiviteId} from 'core-logic/hooks/params';

const FiltreMembre = ({filters, setFilters}: TFiltreProps) => {
  const collectivite_id = useCollectiviteId();
  const utilisateurs = useHistoriqueUtilisateurListe(collectivite_id!);

  // Initialisation du tableau d'options pour le multi-select
  const memberList: {value: string; label: string}[] = [];
  // Ajoute l'option "Tous" s'il y a plus d'une option
  if (utilisateurs && utilisateurs.length > 1) {
    memberList.push({value: ITEM_ALL, label: 'Tous'});
  }
  // Transformation et ajout des données membres au tableau d'options
  utilisateurs &&
    utilisateurs.forEach(u =>
      memberList.push({value: u.modified_by_id!, label: u.modified_by_nom!})
    );

  return (
    <HistoriqueFiltreField title="Membre">
      <MultiSelectFilter
        data-test="filtre-membre"
        values={
          filters.modified_by && getIsAllSelected(filters.modified_by)
            ? undefined
            : filters.modified_by
        }
        options={memberList}
        onSelect={newValues => {
          if (getIsAllSelected(newValues)) {
            const filtres = filters;
            delete filtres.modified_by;
            setFilters({...filtres});
          } else {
            setFilters({
              ...filters,
              modified_by: newValues,
            });
          }
        }}
        placeholderText="Sélectionner des options"
        disabled={memberList.length === 0}
      />
    </HistoriqueFiltreField>
  );
};

export default FiltreMembre;
