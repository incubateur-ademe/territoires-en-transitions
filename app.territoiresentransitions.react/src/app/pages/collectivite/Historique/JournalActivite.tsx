import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { TrackPageView } from '@/ui';
import { pick } from 'es-toolkit';
import { HistoriqueListe } from './HistoriqueListe';
import { THistoriqueProps } from './types';
import { useHistoriqueItemListe } from './useHistoriqueItemListe';
import PageContainer from '@/ui/components/layout/page-container';

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
  const collectivite = useCurrentCollectivite()!;
  const historique = useHistoriqueItemListe(collectivite.collectiviteId);
  return (
    <>
      <TrackPageView
        pageName="app/parametres/historique"
        properties={pick(collectivite, [
          'collectiviteId',
          'niveauAcces',
          'role',
        ])}
      />
      <JournalActivite {...historique} />
    </>
  );
};

export default JournalActiviteConnected;
