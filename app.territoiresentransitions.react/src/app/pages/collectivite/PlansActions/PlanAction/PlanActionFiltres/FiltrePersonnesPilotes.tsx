import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {usePersonnePiloteListe} from '../../FicheAction/data/options/usePersonnePiloteListe';
import {TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {getPersonneId} from '../../FicheAction/data/utils';

const FiltrePersonnesPilotes = ({filters, setFilters}: TFiltreProps) => {
  const {data: personnes} = usePersonnePiloteListe();

  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [];

  // Ajoute l'option "Tous" s'il y a plus d'une option
  if (personnes && personnes.length > 1) {
    options.push({value: ITEM_ALL, label: 'Tous'});
  }

  // Transformation et ajout des personnes aux options
  personnes &&
    personnes.forEach(personne =>
      options.push({
        value: getPersonneId(personne),
        label: personne.nom!,
      })
    );

  return (
    <FilterField title="Personne pilote">
      <MultiSelectFilter
        data-test="filtre-personne-pilote"
        values={filters.pilotes?.map(p => getPersonneId(p))}
        options={options}
        onSelect={newValues => {
          // onClick "tous" ou toggle option
          if (getIsAllSelected(newValues)) {
            const newFilters = filters;
            delete newFilters.pilotes;
            setFilters({...newFilters});
            // d'une option à l'autre
          } else {
            setFilters({
              ...filters,
              pilotes: personnes?.filter(p =>
                newValues.includes(getPersonneId(p))
              ),
            });
          }
        }}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltrePersonnesPilotes;
