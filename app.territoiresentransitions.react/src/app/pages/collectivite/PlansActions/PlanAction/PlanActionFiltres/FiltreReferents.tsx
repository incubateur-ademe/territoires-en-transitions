import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {usePersonneReferenteListe} from '../../FicheAction/data/options/usePersonneReferenteListe';
import {getPersonneId} from '../../FicheAction/data/utils';

const FiltreReferents = ({filters, setFilters}: TFiltreProps) => {
  const {data: personnes} = usePersonneReferenteListe();

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
    <FilterField title="Élu·e référent·e">
      <MultiSelectFilter
        data-test="filtre-referent"
        values={filters.referents?.map(p => getPersonneId(p))}
        options={options}
        onSelect={newValues => {
          // onClick "tous" ou toggle option
          if (getIsAllSelected(newValues)) {
            const newFilters = filters;
            delete newFilters.referents;
            setFilters({...newFilters});
            // d'une option à l'autre
          } else {
            setFilters({
              ...filters,
              referents: personnes?.filter(p =>
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

export default FiltreReferents;
