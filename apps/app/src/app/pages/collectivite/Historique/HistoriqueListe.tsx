import HistoriqueItemActionPrecision from '@/app/app/pages/collectivite/Historique/actionPrecision/HistoriqueItemActionPrecision';
import HistoriqueItemActionStatut from '@/app/app/pages/collectivite/Historique/actionStatut/HistoriqueItemActionStatut';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Event, Pagination, useEventTracker } from '@/ui';
import { FC } from 'react';
import { NB_ITEMS_PER_PAGE } from './filters';
import HistoriqueFiltres from './HistoriqueFiltres/HistoriqueFiltres';
import HistoriqueItemJustification from './reponse/HistoriqueItemJustification';
import HistoriqueItemReponse from './reponse/HistoriqueItemReponse';
import {
  THistoriqueItem,
  THistoriqueItemProps,
  THistoriqueProps,
} from './types';

/**
 * Affiche l'historique des modifications
 */
export const HistoriqueListe = ({
  items,
  total,
  initialFilters,
  filters,
  setFilters,
  isLoading,
}: THistoriqueProps) => {
  const tracker = useEventTracker();

  return (
    <>
      <HistoriqueFiltres
        itemsNumber={total}
        initialFilters={initialFilters}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="flex flex-col gap-5" data-test="Historique">
        {isLoading ? (
          <SpinnerLoader containerClassName="h-60 flex" className="m-auto" />
        ) : total === 0 ? (
          <span data-test="empty_history">
            Aucun historique de modification
          </span>
        ) : (
          items.map((item) => {
            const { type } = item;
            const Item = historiqueParType[type];
            return Item ? <Item key={makeKey(item)} item={item} /> : null;
          })
        )}
        {/* {total === 0 ? (
          <span data-test="empty_history">
            Aucun historique de modification
          </span>
        ) : null}
        {items.map((item) => {
          const { type } = item;
          const Item = historiqueParType[type];
          return Item ? <Item key={makeKey(item)} item={item} /> : null;
        })} */}
      </div>

      <Pagination
        className="mt-6 md:mt-12 mx-auto"
        nbOfElements={total}
        maxElementsPerPage={NB_ITEMS_PER_PAGE}
        selectedPage={filters.page ?? 1}
        onChange={(selected) => {
          setFilters({ ...filters, page: selected });
          tracker(Event.paginationClick);
        }}
        idToScrollTo="filtres-historique"
      />
    </>
  );
};

// correspondances entre le type d'un item de l'historique et le composant
// utilisé pour l'afficher
const historiqueParType: { [k: string]: FC<THistoriqueItemProps> } = {
  action_statut: HistoriqueItemActionStatut,
  action_precision: HistoriqueItemActionPrecision,
  reponse: HistoriqueItemReponse,
  justification: HistoriqueItemJustification,
};

// construit une clé d'identification d'un item de l'historique
const makeKey = (item: THistoriqueItem): string => {
  const { type, action_id, question_id, modified_at } = item;
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
