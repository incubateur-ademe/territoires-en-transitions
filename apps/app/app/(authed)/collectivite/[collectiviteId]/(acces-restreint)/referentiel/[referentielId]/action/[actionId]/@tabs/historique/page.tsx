'use client';

import { useCollectiviteId } from '@/api/collectivites';
import { HistoriqueListe } from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { useHistoriqueItemListe } from '@/app/app/pages/collectivite/Historique/useHistoriqueItemListe';
import { useActionId } from '@/app/referentiels/actions/action-context';

export default function Page() {
  const actionId = useActionId();
  const collectiviteId = useCollectiviteId();
  const historique = useHistoriqueItemListe(collectiviteId, actionId);
  return <HistoriqueListe {...historique} />;
}
