import {FC} from 'react';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistoriqueItemListe} from 'app/pages/collectivite/Historique/useHistoriqueItemListe';
import HistoriqueItemActionStatut from 'app/pages/collectivite/Historique/actionStatut/HistoriqueItemActionStatut';
import HistoriqueItemActionPrecision from 'app/pages/collectivite/Historique/actionPrecision/HistoriqueItemActionPrecision';
import {THistoriqueItem, THistoriqueItemProps, THistoriqueProps} from './types';
import HistoriqueItemReponse from './reponse/HistoriqueItemReponse';
import {NB_ITEMS_PER_PAGE} from './filters';
import HistoriqueFiltres from './HistoriqueFiltres/HistoriqueFiltres';
import HistoriqueItemJustification from './reponse/HistoriqueItemJustification';
import {Pagination} from '@tet/ui';
import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';

/**
 * Affiche l'historique des modifications
 */
export const HistoriqueListe = ({
  items,
  total,
  initialFilters,
  filters,
  setFilters,
}: THistoriqueProps) => {
  const tracker = useFonctionTracker();

  return (
    <>
      <HistoriqueFiltres
        itemsNumber={total}
        initialFilters={initialFilters}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="flex flex-col gap-5" data-test="Historique">
        {total === 0 ? (
          <span data-test="empty_history">
            Aucun historique de modification
          </span>
        ) : null}
        {items.map(item => {
          const {type} = item;
          const Item = historiqueParType[type];
          return Item ? <Item key={makeKey(item)} item={item} /> : null;
        })}
      </div>

      <Pagination
        className="mt-6 md:mt-12 mx-auto"
        nbOfElements={total}
        maxElementsPerPage={NB_ITEMS_PER_PAGE}
        selectedPage={filters.page ?? 1}
        onChange={selected => {
          setFilters({...filters, page: selected});
          tracker({fonction: 'pagination', action: 'clic'});
        }}
        idToScrollTo="filtres-historique"
      />
    </>
  );
};

/**
 * Charge et affiche les données de l'historique
 */
const HistoriqueListeConnected = ({actionId}: {actionId?: string}) => {
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
  justification: HistoriqueItemJustification,
};

// construit une clé d'identification d'un item de l'historique
const makeKey = (item: THistoriqueItem): string => {
  const {type, action_id, question_id, modified_at} = item;
  const timestamp = new Date(modified_at).getTime();

  if (
    type === 'action_statut' ||
    type === 'action_precision' ||
    type === 'preuve'
  ) {
    return `${type}-${action_id}-${timestamp}`;
  }

  if (type === 'reponse' || type === 'justification') {
    return `${type}-${question_id}-${timestamp}`;
  }

  // TODO: gérer les autres types de modification
  return type;
};

export default HistoriqueListeConnected;
