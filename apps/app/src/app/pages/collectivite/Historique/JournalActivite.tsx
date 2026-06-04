'use client';

import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import { HistoriqueListe } from './HistoriqueListe';

export const JournalActivite = () => {
  return (
    <div data-test="JournalActivite" className="grow flex flex-col">
      <PageHeader>
        <PageHeader.Title>{appLabels.journalActivite}</PageHeader.Title>
      </PageHeader>
      <p className="mb-6 font-bold">{appLabels.filtrerHistorique}</p>
      <HistoriqueListe />
    </div>
  );
};
