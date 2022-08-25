import {FC} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {Pagination} from 'app/pages/ToutesLesCollectivites/components/Pagination';
import {useHistoriqueItemListe} from 'app/pages/collectivite/Historique/useHistoriqueItemListe';
import HistoriqueItemActionStatut from 'app/pages/collectivite/Historique/actionStatut/HistoriqueItemActionStatut';
import HistoriqueItemActionPrecision from 'app/pages/collectivite/Historique/actionPrecision/HistoriqueItemActionPrecision';
import {THistoriqueItem, THistoriqueItemProps, THistoriqueProps} from './types';
import HistoriqueItemReponse from './reponse/HistoriqueItemReponse';
import {NB_ITEMS_PER_PAGE} from './filters';

/**
 * Affiche l'historique des modifications
 */
export const HistoriqueListe = ({
  items,
  total,
  filters,
  setFilters,
}: THistoriqueProps) => {
  return (
    <>
      <div className="flex flex-col gap-5" data-test="Historique">
        {total === 0 ? (
          <span data-test="empty_history">En attente d’une modification</span>
        ) : null}
        {items.map(item => {
          const {type} = item;
          const Item = historiqueParType[type];
          return <Item key={makeKey(item)} item={item} />;
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

/**
 * Charge et affiche les données de l'historique
 */
export default ({actionId}: {actionId?: string}) => {
  const collectivite_id = useCollectiviteId()!;
  const historique = useHistoriqueItemListe(collectivite_id, actionId);
  return <HistoriqueListe {...historique} />;
};

// correspondances entre le type d'un item de l'historique et le composant
// utilisé pour l'afficher
const historiqueParType: {[k: string]: FC<THistoriqueItemProps>} = {
  action_statut: HistoriqueItemActionStatut,
  action_precision: HistoriqueItemActionPrecision,
  reponse: HistoriqueItemReponse,
};

// construit une clé d'identification d'un item de l'historique
const makeKey = (item: THistoriqueItem): string => {
  const {type, action_id, question_id, modified_at} = item;
  const timestamp = new Date(modified_at).getTime();

  if (
    type === 'action_statut' ||
    type === 'action_precision' ||
    type === 'preuve'
  )
    return `${type}-${action_id}-${timestamp}`;
  if (type === 'reponse') return `${type}-${question_id}-${timestamp}`;

  // TODO: gérer les autres types de modification
  return 'TODO';
};
