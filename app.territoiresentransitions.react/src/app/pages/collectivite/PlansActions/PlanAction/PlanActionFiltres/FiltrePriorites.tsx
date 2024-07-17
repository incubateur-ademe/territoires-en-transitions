import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {SANS_PRIORITE, TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionNiveauPrioriteOptions} from '../../../../../../ui/dropdownLists/listesStatiques';
import {TFicheActionNiveauxPriorite} from 'types/alias';
import BadgePriorite from '../../components/BadgePriorite';

const FiltrePriorites = ({filters, setFilters}: TFiltreProps) => {
  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [
    {value: ITEM_ALL, label: 'Tous'},
    {value: SANS_PRIORITE, label: 'Non priorisé'},
    ...ficheActionNiveauPrioriteOptions,
  ];

  const selectPriorite = (newPriorites: string[]) => {
    const newFilters = filters;
    const priorites = newPriorites.filter(p => p !== SANS_PRIORITE);

    if (getIsAllSelected(newPriorites)) {
      delete newFilters.sans_niveau;
      delete newFilters.priorites;
      return {...newFilters};
    } else if (newPriorites.includes(SANS_PRIORITE)) {
      if (filters.sans_niveau === 1) {
        delete newFilters.sans_niveau;
        return {
          ...newFilters,
          priorites: priorites as TFicheActionNiveauxPriorite[],
        };
      } else {
        delete newFilters.priorites;
        return {...newFilters, sans_niveau: 1};
      }
    } else {
      return {
        ...newFilters,
        priorites: priorites as TFicheActionNiveauxPriorite[],
      };
    }
  };

  return (
    <FilterField title="Niveau de priorité">
      <MultiSelectFilter
        data-test="filtre-priorite"
        values={
          filters.sans_niveau && filters.sans_niveau === 1
            ? [SANS_PRIORITE]
            : filters.priorites
        }
        options={options}
        onSelect={newValues => setFilters(selectPriorite(newValues))}
        renderSelection={values => (
          <div className="flex items-center flex-wrap gap-2">
            {values.map(v =>
              v === SANS_PRIORITE ? (
                <span key={v}>Non priorisé</span>
              ) : (
                <BadgePriorite key={v} priorite={v} />
              )
            )}
          </div>
        )}
        renderOption={option => {
          if (option.value === ITEM_ALL || option.value === SANS_PRIORITE) {
            return <span>{option.label}</span>;
          }
          return (
            <BadgePriorite
              priorite={option.value as TFicheActionNiveauxPriorite}
            />
          );
        }}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltrePriorites;
