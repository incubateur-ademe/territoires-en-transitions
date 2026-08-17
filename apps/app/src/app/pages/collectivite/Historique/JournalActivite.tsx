'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import { HistoriqueListe } from './HistoriqueListe';
import { useHistoriqueFilters } from './use-historique-filters';

export const JournalActivite = () => {
  const [filters, setFilters] = useHistoriqueFilters();

  return (
    <div data-test="JournalActivite" className="grow flex flex-col">
      <PageHeader>
        <PageHeader.Title>{appLabels.journalActivite}</PageHeader.Title>
      </PageHeader>
      <p className="mb-6 font-bold">{appLabels.filtrerHistorique}</p>
      <HistoriqueListe filters={filters} onFiltersChange={setFilters} />
    </div>
  );
};
