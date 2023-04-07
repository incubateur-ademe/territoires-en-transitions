import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionStatutOptions} from '../../FicheAction/data/options/listesStatiques';
import FicheActionBadgeStatut from '../../FicheAction/FicheActionForm/FicheActionBadgeStatut';
import {TFicheActionStatuts} from 'types/alias';

const FiltreStatuts = ({filters, setFilters}: TFiltreProps) => {
  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    {value: ITEM_ALL, label: 'Tous'},
    ...ficheActionStatutOptions,
  ];

  return (
    <FilterField title="Statut">
      <MultiSelectFilter
        data-test="filtre-statut"
        values={filters.statuts}
        options={options}
        onSelect={newValues => {
          // onClick "tous" ou toggle option
          if (getIsAllSelected(newValues)) {
            const newFilters = filters;
            delete newFilters.statuts;
            setFilters({...newFilters});
            // d'une option à l'autre
          } else {
            setFilters({...filters, statuts: newValues});
          }
        }}
        renderSelection={values => (
          <div className="flex items-center flex-wrap gap-2">
            {values.map(v => (
              <FicheActionBadgeStatut key={v} statut={v} />
            ))}
          </div>
        )}
        renderOption={option => (
          <FicheActionBadgeStatut
            statut={option.value as TFicheActionStatuts}
          />
        )}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltreStatuts;
