'use client';

import { HistoriqueListe } from '@/app/referentiels/Historique/HistoriqueListe';
import { useHistoriqueFilters } from '@/app/referentiels/Historique/use-historique-filters';

export function HistoriquePanelContent({ actionId }: { actionId: string }) {
  const [filters, setFilters] = useHistoriqueFilters();

  return (
    <HistoriqueListe
      actionId={actionId}
      filters={filters}
      onFiltersChange={setFilters}
      small
    />
  );
}
