import TagFilters from 'ui/shared/filters/TagFilters';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import {ficheActionEcheanceOptions} from '../../../../../../../ui/dropdownLists/listesStatiques';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';
import {TFicheActionEcheances} from 'types/alias';

type Props = {
  filtersOptions: TFichesActionsListe;
};

const FiltrePrimaireEcheance = ({filtersOptions}: Props) => {
  const {filters, setFilters} = filtersOptions;

  const selectEcheance = (echeance: string) => {
    const newFilters = filters;
    if (echeance === ITEM_ALL) {
      delete newFilters.echeance;
      return {...newFilters};
    } else {
      return {
        ...newFilters,
        echeance: echeance as TFicheActionEcheances,
      };
    }
  };

  return (
    <TagFilters
      defaultOption={filters.echeance}
      options={[
        {value: ITEM_ALL, label: 'Toutes les échéances'},
        ...ficheActionEcheanceOptions,
      ]}
      onChange={echeance => setFilters(selectEcheance(echeance))}
    />
  );
};

export default FiltrePrimaireEcheance;
