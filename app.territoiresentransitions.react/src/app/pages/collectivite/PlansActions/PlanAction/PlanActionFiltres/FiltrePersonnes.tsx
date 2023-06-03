import FilterField from 'ui/shared/filters/FilterField';
import {TOption} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {TFilters, TFiltreProps} from '../../FicheAction/data/filters';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/filters/commons';
import {getPersonneId} from '../../FicheAction/data/utils';
import {usePersonneListe} from '../../FicheAction/data/options/usePersonneListe';

type Props = TFiltreProps & {
  label: string;
  filterKey: keyof TFilters;
  dataTest?: string;
};

const FiltrePersonnes = ({
  label,
  filterKey,
  filters,
  setFilters,
  dataTest,
}: Props) => {
  const {data: personnes} = usePersonneListe();

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

  // Renvoie les bonnes valeurs en fonction du filtre personne utlisé
  const values = () => {
    if (filterKey === 'referents') {
      return filters.referents;
    }
    if (filterKey === 'pilotes') {
      return filters.pilotes;
    }

    return [];
  };

  // onSelect en fonction du filtre personne utilisé
  const onSelect = (newValues: string[]) => {
    // onClick "tous" ou toggle option
    if (getIsAllSelected(newValues)) {
      const newFilters = filters;
      if (filterKey === 'referents') {
        delete newFilters.referents;
      }
      if (filterKey === 'pilotes') {
        delete newFilters.pilotes;
      }
      setFilters({...newFilters});
      // d'une option à l'autre
    } else {
      if (filterKey === 'referents') {
        setFilters({
          ...filters,
          referents: personnes
            ?.filter(p => newValues.includes(getPersonneId(p)))
            .map(p => getPersonneId(p)),
        });
      }
      if (filterKey === 'pilotes') {
        setFilters({
          ...filters,
          pilotes: personnes
            ?.filter(p => newValues.includes(getPersonneId(p)))
            .map(p => getPersonneId(p)),
        });
      }
    }
  };

  return (
    <FilterField title={label}>
      <MultiSelectFilter
        data-test={dataTest}
        values={values()}
        options={options}
        onSelect={newValues => onSelect(newValues)}
        placeholderText="Sélectionner des options"
        disabled={options.length === 0}
      />
    </FilterField>
  );
};

export default FiltrePersonnes;
