import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {SANS_STATUT, TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionStatutOptions} from '../../../../../../ui/dropdownLists/listesStatiques';
import BadgeStatut from '../../components/BadgeStatut';
import {TFicheActionStatuts} from 'types/alias';

const FiltreStatuts = ({filters, setFilters}: TFiltreProps) => {
  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    {value: ITEM_ALL, label: 'Tous les statuts'},
    {value: SANS_STATUT, label: 'Sans statut'},
    ...ficheActionStatutOptions,
  ];

  const selectStatut = (newStatuts: string[]) => {
    const newFilters = filters;
    const statuts = newStatuts.filter(s => s !== SANS_STATUT);

    if (getIsAllSelected(newStatuts)) {
      delete newFilters.sans_statut;
      delete newFilters.statuts;
      return {...newFilters};
    } else if (newStatuts.includes(SANS_STATUT)) {
      if (filters.sans_statut === 1) {
        delete newFilters.sans_statut;
        return {...newFilters, statuts: statuts as TFicheActionStatuts[]};
      } else {
        delete newFilters.statuts;
        return {...newFilters, sans_statut: 1};
      }
    } else {
      return {...newFilters, statuts: statuts as TFicheActionStatuts[]};
    }
  };

  return (
    <FilterField title="Statut">
      <MultiSelectFilter
        data-test="filtre-statut"
        values={
          filters.sans_statut && filters.sans_statut === 1
            ? [SANS_STATUT]
            : filters.statuts
        }
        options={options}
        onSelect={newValues => setFilters(selectStatut(newValues))}
        renderSelection={values => (
          <div className="flex items-center flex-wrap gap-2">
            {values.map(v =>
              v === SANS_STATUT ? (
                <span key={v}>Sans statut</span>
              ) : (
                <BadgeStatut key={v} statut={v} />
              )
            )}
          </div>
        )}
        renderOption={option => {
          if (option.value === ITEM_ALL || option.value === SANS_STATUT) {
            return <span>{option.label}</span>;
          }
          return <BadgeStatut statut={option.value as TFicheActionStatuts} />;
        }}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltreStatuts;
