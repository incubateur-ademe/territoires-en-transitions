import TagFilters from 'ui/shared/filters/TagFilters';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionNiveauPrioriteOptions} from '../../../../../../../ui/dropdownLists/listesStatiques';
import {TFicheActionNiveauxPriorite} from 'types/alias';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';
import {SANS_PRIORITE} from '../../../FicheAction/data/filters';

type Props = {
  filtersOptions: TFichesActionsListe;
};

const FiltrePrimairePriorites = ({filtersOptions}: Props) => {
  const {filters, setFilters} = filtersOptions;

  const getDefaultOption = () => {
    if (filters.sans_niveau) {
      return SANS_PRIORITE;
    }
    if (filters.priorites) {
      return filters.priorites[0];
    }
    return ITEM_ALL;
  };

  const selectPriorite = (priorite: string) => {
    const newFilters = filters;
    if (priorite === ITEM_ALL) {
      delete newFilters.sans_niveau;
      delete newFilters.priorites;
      return {...newFilters};
    } else if (priorite === SANS_PRIORITE) {
      delete newFilters.priorites;
      return {...newFilters, sans_niveau: 1};
    } else {
      delete newFilters.sans_niveau;
      return {
        ...newFilters,
        priorites: [priorite as TFicheActionNiveauxPriorite],
      };
    }
  };

  return (
    <TagFilters
      defaultOption={getDefaultOption()}
      options={[
        {value: ITEM_ALL, label: 'Tous les niveaux de priorité'},
        {value: SANS_PRIORITE, label: 'Non priorisé'},
        ...ficheActionNiveauPrioriteOptions,
      ]}
      onChange={priorite => setFilters(selectPriorite(priorite))}
    />
  );
};

export default FiltrePrimairePriorites;
