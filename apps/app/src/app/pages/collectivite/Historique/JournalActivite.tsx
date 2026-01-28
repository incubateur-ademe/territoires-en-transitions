'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import { Divider } from '@tet/ui';
import { HistoriqueListe } from './HistoriqueListe';
import { THistoriqueProps } from './types';
import { useHistoriqueItemListe } from './useHistoriqueItemListe';

/**
 * Affiche le journal d'activité d'une collectivité
 */
export const JournalActivite = (props: THistoriqueProps) => {
  return (
    <div data-test="JournalActivite" className="grow flex flex-col">
      <h1 className="text-center my-12">{"Journal d'activité"}</h1>
      <Divider className="mb-6" />
      <HistoriqueListe {...props} />
    </div>
  );
};

const JournalActiviteConnected = () => {
  const collectiviteId = useCollectiviteId();
  const historique = useHistoriqueItemListe(collectiviteId);
  return <JournalActivite {...historique} />;
};

export default JournalActiviteConnected;
