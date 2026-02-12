'use client';

import { HistoriqueListe } from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { useActionId } from '@/app/referentiels/actions/action-context';

export default function Page() {
  const actionId = useActionId();
  return <HistoriqueListe actionId={actionId} />;
}
