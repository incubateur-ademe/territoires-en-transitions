import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { PageContainer } from '@/app/ui/layout/page-layout';
import { TrackPageView } from '@/ui';
import { pick } from 'es-toolkit';
import { HistoriqueListe } from './HistoriqueListe';
import { THistoriqueProps } from './types';
import { useHistoriqueItemListe } from './useHistoriqueItemListe';

/**
 * Affiche le journal d'activité d'une collectivité
 */
export const JournalActivite = (props: THistoriqueProps) => {
  return (
    <PageContainer dataTest="JournalActivite" className="mt-9 mb-16">
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
      <JournalActivite {...historique} />;
    </>
  );
};

export default JournalActiviteConnected;
