import {FC} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Pagination} from 'app/pages/ToutesLesCollectivites/components/Pagination';
import {useHistoriqueItemListe} from 'app/pages/collectivite/Historique/useHistoriqueItemListe';
import HistoriqueItemActionStatut from 'app/pages/collectivite/Historique/actionStatut/HistoriqueItemActionStatut';
import HistoriqueItemActionPrecision from 'app/pages/collectivite/Historique/actionPrecision/HistoriqueItemActionPrecision';
import {THistoriqueItemProps, THistoriqueProps} from './types';
import HistoriqueItemReponse from './reponse/HistoriqueItemReponse';
import {NB_ITEMS_PER_PAGE} from './filters';

export const HistoriqueListe = ({
  items,
  total,
  filters,
  setFilters,
}: THistoriqueProps) => {
  return (
    <>
      <div className="flex flex-col gap-5">
        {total === 0 ? (
          <span data-test="empty_history">En attente d’une modification</span>
        ) : null}
        {items.map(item => {
          const {type, action_id, modified_at} = item;
          const Item = historiqueParType[type];
          return (
            <div
              data-test={`action-statut-historique-${action_id}`}
              key={`${action_id}-${modified_at}`}
            >
              <Item item={item} />
            </div>
          );
        })}
      </div>
      {total !== 0 && (
        <div className="flex justify-center mt-6 md:mt-12">
          <Pagination
            nbOfPages={Math.ceil(total / NB_ITEMS_PER_PAGE)}
            selectedPage={filters.page ?? 1}
            onChange={selected => setFilters({...filters, page: selected})}
          />
        </div>
      )}
    </>
  );
};

export default ({actionId}: {actionId?: string}) => {
  const collectivite_id = useCollectiviteId()!;
  const historique = useHistoriqueItemListe(collectivite_id, actionId);
  return <HistoriqueListe {...historique} />;
};

const historiqueParType: {[k: string]: FC<THistoriqueItemProps>} = {
  action_statut: HistoriqueItemActionStatut,
  action_precision: HistoriqueItemActionPrecision,
  reponse: HistoriqueItemReponse,
};
