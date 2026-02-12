import { Divider } from '@tet/ui';
import { HistoriqueListe } from './HistoriqueListe';

/**
 * Affiche le journal d'activité d'une collectivité
 */
export const JournalActivite = () => {
  return (
    <div data-test="JournalActivite" className="grow flex flex-col">
      <h1 className="text-center my-12">{"Journal d'activité"}</h1>
      <Divider className="mb-6" />
      <HistoriqueListe />
    </div>
  );
};
