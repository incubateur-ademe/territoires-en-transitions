import {getIsAllSelected} from 'ui/shared/filters/commons';
import FilterField from 'ui/shared/filters/FilterField';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {filtresTypeOptions, TFiltreProps} from '../filters';

const FiltreType = ({filters, setFilters}: TFiltreProps) => {
  return (
    <FilterField title="Type d'élément modifié">
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
    </FilterField>
  );
};

export default FiltreType;
