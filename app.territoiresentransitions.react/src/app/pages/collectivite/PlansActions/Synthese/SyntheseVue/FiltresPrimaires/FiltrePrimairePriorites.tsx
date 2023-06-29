import TagFilters from 'ui/shared/filters/TagFilters';
import {ITEM_ALL, getIsAllSelected} from 'ui/shared/filters/commons';
import {ficheActionNiveauPrioriteOptions} from '../../../FicheAction/data/options/listesStatiques';
import {TFicheActionNiveauxPriorite} from 'types/alias';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';

type Props = {
  filtersOptions: TFichesActionsListe;
};

const FiltrePrimairePriorites = ({filtersOptions}: Props) => {
  return (
    <TagFilters
      defaultOption={
        filtersOptions.filters.priorites
          ? filtersOptions.filters.priorites[0]
          : ITEM_ALL
      }
      name="priorites"
      options={[
        {value: ITEM_ALL, label: 'Tous les niveaux de priorité'},
        ...ficheActionNiveauPrioriteOptions,
      ]}
      onChange={priorite => {
        if (getIsAllSelected([priorite])) {
          const newFilters = filtersOptions.filters;
          delete newFilters.priorites;
          filtersOptions.setFilters({...newFilters});
          // d'une option à l'autre
        } else {
          filtersOptions.setFilters({
            ...filtersOptions.filters,
            priorites: [priorite as TFicheActionNiveauxPriorite],
          });
        }
      }}
    />
  );
};

export default FiltrePrimairePriorites;
