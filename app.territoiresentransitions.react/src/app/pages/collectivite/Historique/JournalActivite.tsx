import {
  useCollectiviteId,
  useGetCurrentCollectivite,
} from '@/api/collectivites';
import PageContainer from '@/ui/components/layout/page-container';
import { HistoriqueListe } from './HistoriqueListe';
import { THistoriqueProps } from './types';
import { useHistoriqueItemListe } from './useHistoriqueItemListe';

/**
 * Affiche le journal d'activité d'une collectivité
 */
export const JournalActivite = (props: THistoriqueProps) => {
  return (
    <PageContainer dataTest="JournalActivite" bgColor="white">
      <h1 className="text-center my-12">{"Journal d'activité"}</h1>
      <hr />
      <HistoriqueListe {...props} />
    </PageContainer>
  );
};

const JournalActiviteConnected = () => {
  const collectiviteId = useCollectiviteId();
  const collectivite = useGetCurrentCollectivite(collectiviteId)!;
  const historique = useHistoriqueItemListe(collectivite.collectiviteId);
  return <JournalActivite {...historique} />;
};

export default JournalActiviteConnected;
