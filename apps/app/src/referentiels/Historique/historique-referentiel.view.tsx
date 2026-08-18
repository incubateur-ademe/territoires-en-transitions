'use client';

import { ReferentielId } from '@tet/domain/referentiels';
import { HistoriqueListe } from './HistoriqueListe';
import { useHistoriqueFilters } from './use-historique-filters';

export const HistoriqueReferentielView = ({
  referentielId,
}: {
  referentielId: ReferentielId;
}) => {
  const [filters, setFilters] = useHistoriqueFilters();

  return (
    <HistoriqueListe
      referentielId={referentielId}
      filters={filters}
      onFiltersChange={setFilters}
    />
  );
};
