import {useCollectiviteId} from 'core-logic/hooks/params';
import {THistoriqueProps} from './types';
import {HistoriqueListe} from './HistoriqueListe';
import {useHistoriqueItemListe} from './useHistoriqueItemListe';

/**
 * Affiche le journal d'activité d'une collectivité
 */
export const JournalActivite = (props: THistoriqueProps) => {
  return (
    <main data-test="JournalActivite" className="fr-container mt-9 mb-16">
      <h1 className="text-center fr-mt-4w fr-mb-4w">Journal d'activité</h1>
      <hr />
      <HistoriqueListe {...props} />
    </main>
  );
};

export default () => {
  const collectivite_id = useCollectiviteId()!;
  const historique = useHistoriqueItemListe(collectivite_id);
  return <JournalActivite {...historique} />;
};
