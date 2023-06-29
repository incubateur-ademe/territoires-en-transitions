import TagFilters from 'ui/shared/filters/TagFilters';
import {ITEM_ALL, getIsAllSelected} from 'ui/shared/filters/commons';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';
import {usePersonneListe} from '../../../FicheAction/data/options/usePersonneListe';
import {TOption} from 'ui/shared/select/commons';
import {getPersonneId} from '../../../FicheAction/data/utils';

type Props = {
  filterKey: 'pilotes' | 'referents';
  filtersOptions: TFichesActionsListe;
};

const FiltrePrimairePersonne = ({filterKey, filtersOptions}: Props) => {
  const {filters, setFilters} = filtersOptions;
  const {data: personnes} = usePersonneListe();

  // Initialisation du tableau d'options pour le multi-select
  const options: TOption[] = [];

  // Ajoute l'option "Tous" s'il y a plus d'une option
  if (personnes && personnes.length > 1) {
    options.push({
      value: ITEM_ALL,
      label: `Tous les personnes ${
        (filterKey === 'pilotes' && 'pilotes') ||
        (filterKey === 'referents' && 'référentes')
      }`,
    });
  }

  // Transformation et ajout des personnes aux options
  personnes &&
    personnes.forEach(personne =>
      options.push({
        value: getPersonneId(personne),
        label: personne.nom!,
      })
    );

  // Renvoie la bonne valeur en fonction du filtre personne utlisé
  const getDefaultOption = () => {
    if (filterKey === 'pilotes' && filters.pilotes) {
      return filters.pilotes[0];
    }
    if (filterKey === 'pilotes' && filters.referents) {
      return filters.referents[0];
    }
    return ITEM_ALL;
  };

  // onSelect en fonction du filtre personne utilisé
  const onChange = (value: string) => {
    // onClick "tous" ou toggle option
    if (getIsAllSelected([value])) {
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
          referents: [value],
        });
      }
      if (filterKey === 'pilotes') {
        setFilters({
          ...filters,
          pilotes: [value],
        });
      }
    }
  };

  return (
    <TagFilters
      defaultOption={getDefaultOption()}
      name={filterKey}
      options={options}
      onChange={onChange}
    />
  );
};

export default FiltrePrimairePersonne;
