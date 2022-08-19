import {useCollectiviteId} from 'core-logic/hooks/params';
import {THistoriqueItem} from './types';
import {HistoriqueListe} from './HistoriqueListe';
import {useHistoriqueItemListe} from './useHistoriqueItemListe';

export type TJournalActiviteProps = {
  historiqueItemListe: THistoriqueItem[];
};

/**
 * Affiche le journal d'activité d'une collectivité
 */
export const JournalActivite = (props: TJournalActiviteProps) => {
  const {historiqueItemListe} = props;
  return (
    <main data-test="JournalActivite" className="fr-container mt-9 mb-16">
      <h1 className="text-center fr-mt-4w fr-mb-1w">Journal d'activité</h1>
      <hr />
      <HistoriqueListe historiqueItemListe={historiqueItemListe} />
    </main>
  );
};

export default () => {
  const collectivite_id = useCollectiviteId()!;
  const historiqueItemListe = useHistoriqueItemListe({
    collectivite_id,
  });
  return <JournalActivite historiqueItemListe={historiqueItemListe} />;
};
