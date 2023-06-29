import TagFilters from 'ui/shared/filters/TagFilters';
import {ITEM_ALL, getIsAllSelected} from 'ui/shared/filters/commons';
import {ficheActionStatutOptions} from '../../../FicheAction/data/options/listesStatiques';
import {TFicheActionStatuts} from 'types/alias';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';

type Props = {
  filtersOptions: TFichesActionsListe;
};

const FiltrePrimaireStatuts = ({filtersOptions}: Props) => {
  return (
    <TagFilters
      defaultOption={
        filtersOptions.filters.statuts
          ? filtersOptions.filters.statuts[0]
          : ITEM_ALL
      }
      name="statuts"
      options={[
        {value: ITEM_ALL, label: 'Tous les statuts'},
        ...ficheActionStatutOptions,
      ]}
      onChange={statut => {
        if (getIsAllSelected([statut])) {
          const newFilters = filtersOptions.filters;
          delete newFilters.statuts;
          filtersOptions.setFilters({...newFilters});
          // d'une option à l'autre
        } else {
          filtersOptions.setFilters({
            ...filtersOptions.filters,
            statuts: [statut as TFicheActionStatuts],
          });
        }
      }}
    />
  );
};

export default FiltrePrimaireStatuts;
