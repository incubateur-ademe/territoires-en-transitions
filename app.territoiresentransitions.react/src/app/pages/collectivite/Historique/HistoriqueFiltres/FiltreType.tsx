import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import HistoriqueFiltreField from './HistoriqueFiltreField';

import {filtresTypeOptions, TFiltreProps} from '../filters';
import {getIsAllSelected} from 'ui/shared/select/commons';

const FiltreType = ({filters, setFilters}: TFiltreProps) => {
  return (
    <HistoriqueFiltreField title="Type d'élément modifié">
      <MultiSelectFilter
        data-test="filtre-type"
        values={
          filters.types && getIsAllSelected(filters.types)
            ? undefined
            : filters.types
        }
        options={filtresTypeOptions}
        onSelect={newValues => {
          if (getIsAllSelected(newValues)) {
            const filtres = filters;
            delete filtres.types;
            setFilters({...filtres});
          } else {
            setFilters({...filters, types: newValues});
          }
        }}
        placeholderText="Sélectionner des options"
      />
    </HistoriqueFiltreField>
  );
};

export default FiltreType;
