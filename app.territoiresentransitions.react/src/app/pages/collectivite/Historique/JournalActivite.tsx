import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
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
    <main data-test="JournalActivite" className="fr-container mt-9 mb-16">
      <h1 className="text-center fr-mt-6w fr-mb-6w">{"Journal d'activité"}</h1>
      <hr />
      <HistoriqueListe {...props} />
    </main>
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
