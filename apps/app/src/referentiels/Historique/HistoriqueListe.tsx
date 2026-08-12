'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  NB_HISTORIQUE_ITEMS_PER_PAGE,
  ReferentielId,
  HistoriqueItem,
} from '@tet/domain/referentiels';
import { Alert, Event, Pagination, useEventTracker } from '@tet/ui';
import { Filters, SetFilters } from './filters';
import HistoriqueFiltres from './HistoriqueFiltres/HistoriqueFiltres';
import HistoriqueItemActionPrecision from './HistoriqueItemActionPrecision';
import HistoriqueItemActionStatut from './HistoriqueItemActionStatut';
import HistoriqueItemJustification from './HistoriqueItemJustification';
import HistoriqueItemReponse from './HistoriqueItemReponse';
import { useHistoriqueItemListe } from './useHistoriqueItemListe';

type HistoriqueListeProps = {
  filters: Filters;
  onFiltersChange: SetFilters;
  actionId?: string;
  referentielId?: ReferentielId;
  small?: boolean;
};

export const HistoriqueListe = ({
  filters,
  onFiltersChange,
  actionId,
  referentielId,
  small,
}: HistoriqueListeProps) => {
  const tracker = useEventTracker();
  const { items, total, isLoading, isError } = useHistoriqueItemListe({
    filters,
    actionId,
    referentielId,
  });

  return (
    <>
      <HistoriqueFiltres
        itemsNumber={total}
        filters={filters}
        setFilters={onFiltersChange}
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
          onFiltersChange({ page: selected });
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
        {appLabels.aucunHistorique}
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
