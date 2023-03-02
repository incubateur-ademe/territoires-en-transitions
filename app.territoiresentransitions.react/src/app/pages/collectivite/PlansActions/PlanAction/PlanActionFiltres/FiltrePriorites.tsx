import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionNiveauPrioriteOptions} from '../../FicheAction/data/options/listesStatiques';

const FiltrePriorites = ({filters, setFilters}: TFiltreProps) => {
  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    {value: ITEM_ALL, label: 'Tous'},
    ...ficheActionNiveauPrioriteOptions,
  ];

  return (
    <FilterField title="Niveau de priorité">
      <MultiSelectFilter
        data-test="filtre-priorite"
        values={filters.priorites}
        options={options}
        onSelect={newValues => {
          // onClick "tous" ou toggle option
          if (getIsAllSelected(newValues)) {
            const newFilters = filters;
            delete newFilters.priorites;
            setFilters({...newFilters});
            // d'une option à l'autre
          } else {
            setFilters({...filters, priorites: newValues});
          }
        }}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltrePriorites;
