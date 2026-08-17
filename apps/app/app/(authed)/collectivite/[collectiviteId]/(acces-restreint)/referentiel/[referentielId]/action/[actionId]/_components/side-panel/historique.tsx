'use client';

import { HistoriqueListe } from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { useHistoriqueFilters } from '@/app/app/pages/collectivite/Historique/use-historique-filters';

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
