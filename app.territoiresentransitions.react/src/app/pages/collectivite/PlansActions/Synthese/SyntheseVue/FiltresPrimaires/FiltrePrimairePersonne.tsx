import TagFilters from 'ui/shared/filters/TagFilters';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';
import {usePersonneListe} from '../../../FicheAction/data/options/usePersonneListe';
import {TOption} from 'ui/shared/select/commons';
import {SANS_PILOTE, SANS_REFERENT} from '../../../FicheAction/data/filters';
import {getPersonneStringId} from 'ui/dropdownLists/PersonnesDropdown/utils';

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
      label: `${
        (filterKey === 'pilotes' && 'Toutes les personnes pilotes') ||
        (filterKey === 'referents' && 'Tou·tes les élu·es référent·es')
      }`,
    });
  }

  if (filterKey === 'pilotes') {
    options.push({
      value: SANS_PILOTE,
      label: 'Sans pilote',
    });
  }

  if (filterKey === 'referents') {
    options.push({
      value: SANS_REFERENT,
      label: 'Sans élu·e référent·e',
    });
  }

  // Transformation et ajout des personnes aux options
  personnes &&
    personnes.forEach(personne =>
      options.push({
        value: getPersonneStringId(personne),
        label: personne.nom!,
      })
    );

  // Renvoie la bonne valeur en fonction du filtre personne utlisé
  const getDefaultOption = () => {
    if (filters.sans_pilote) {
      return SANS_PILOTE;
    }
    if (filters.sans_referent) {
      return SANS_REFERENT;
    }
    if (filterKey === 'pilotes' && filters.pilotes) {
      return filters.pilotes[0];
    }
    if (filterKey === 'referents' && filters.referents) {
      return filters.referents[0];
    }
    return ITEM_ALL;
  };

  // onSelect en fonction du filtre personne utilisé
  const onChange = (value: string) => {
    const newFilters = filters;
    if (value === 'tous') {
      delete newFilters.sans_pilote;
      delete newFilters.sans_referent;
      if (filterKey === 'referents') {
        delete newFilters.referents;
      }
      if (filterKey === 'pilotes') {
        delete newFilters.pilotes;
      }
      return {...newFilters};
    } else if (value === SANS_PILOTE) {
      delete newFilters.pilotes;
      return {...newFilters, sans_pilote: 1};
    } else if (value === SANS_REFERENT) {
      delete newFilters.referents;
      return {...newFilters, sans_referent: 1};
    } else {
      delete newFilters.sans_pilote;
      delete newFilters.sans_referent;
      return {
        ...newFilters,
        [filterKey]: [value],
      };
    }
  };

  return (
    <TagFilters
      defaultOption={getDefaultOption()}
      options={options}
      onChange={value => setFilters(onChange(value))}
    />
  );
};

export default FiltrePrimairePersonne;
