'use client';

import HistoriqueItemActionPrecision from '@/app/app/pages/collectivite/Historique/actionPrecision/HistoriqueItemActionPrecision';
import HistoriqueItemActionStatut from '@/app/app/pages/collectivite/Historique/actionStatut/HistoriqueItemActionStatut';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { NB_HISTORIQUE_ITEMS_PER_PAGE } from '@tet/domain/referentiels';
import { Alert, Event, Pagination, useEventTracker } from '@tet/ui';
import HistoriqueFiltres from './HistoriqueFiltres/HistoriqueFiltres';
import HistoriqueItemJustification from './reponse/HistoriqueItemJustification';
import HistoriqueItemReponse from './reponse/HistoriqueItemReponse';
import { HistoriqueItem } from './types';
import { useHistoriqueItemListe } from './useHistoriqueItemListe';

/**
 * Affiche l'historique des modifications
 */
export const HistoriqueListe = ({
  actionId,
  small,
}: {
  actionId?: string;
  small?: boolean;
}) => {
  const tracker = useEventTracker();
  const { items, total, filters, setFilters, isLoading, isError } =
    useHistoriqueItemListe({ actionId });

  return (
    <>
      <HistoriqueFiltres
        itemsNumber={total}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="grow flex flex-col gap-5" data-test="Historique">
        <Content
          isLoading={isLoading}
          isError={isError}
          items={items}
          total={total}
        />
      </div>

      <Pagination
        className="mt-6 md:mt-12 mx-auto"
        nbOfElements={total}
        maxElementsPerPage={NB_HISTORIQUE_ITEMS_PER_PAGE}
        selectedPage={filters.page ?? 1}
        onChange={(selected) => {
          setFilters({ ...filters, page: selected });
          tracker(Event.paginationClick);
        }}
        idToScrollTo="filtres-historique"
        small={small}
      />
    </>
  );
};

const Content = ({
  isLoading,
  isError,
  items,
  total,
}: {
  items: HistoriqueItem[];
  total: number;
  isLoading?: boolean;
  isError: boolean;
}) => {
  if (isLoading) {
    return <SpinnerLoader className="m-auto" />;
  }
  if (isError) {
    return (
      <div role="alert" data-test="historique_error">
        <Alert
          state="error"
          title="Une erreur est survenue lors du chargement de l'historique. Veuillez réessayer."
        />
      </div>
    );
  }
  if (total === 0) {
    return (
      <span className="text-sm text-grey-6" data-test="empty_history">
        Aucun historique de modification
      </span>
    );
  }
  return items.map((item) => {
    const key = makeKey(item);
    switch (item.type) {
      case 'action_statut':
        return <HistoriqueItemActionStatut key={key} item={item} />;
      case 'action_precision':
        return <HistoriqueItemActionPrecision key={key} item={item} />;
      case 'reponse':
        return <HistoriqueItemReponse key={key} item={item} />;
      case 'justification':
        return <HistoriqueItemJustification key={key} item={item} />;
    }
  });
};

// construit une clé d'identification d'un item de l'historique
const makeKey = (item: HistoriqueItem): string => {
  const timestamp = new Date(item.modifiedAt).getTime();
  switch (item.type) {
    case 'action_statut':
    case 'action_precision':
      return `${item.type}-${item.actionId}-${timestamp}`;
    case 'reponse':
    case 'justification':
      return `${item.type}-${item.questionId}-${timestamp}`;
  }
};
