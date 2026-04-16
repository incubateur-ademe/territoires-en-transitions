import { appLabels } from '@/app/labels/catalog';
import { Divider } from '@tet/ui';
import { HistoriqueListe } from './HistoriqueListe';

export const JournalActivite = () => {
  return (
    <div data-test="JournalActivite" className="grow flex flex-col">
      <h1 className="text-center my-12">{appLabels.journalActivite}</h1>
      <Divider className="mb-6" />
      <p className="mb-6 font-bold">{appLabels.filtrerHistorique}</p>
      <HistoriqueListe />
    </div>
  );
};
