'use client';

import HistoriqueListeConnected from '@/app/app/pages/collectivite/Historique/HistoriqueListe';
import { DEPRECATED_useActionDefinition } from '@/app/referentiels/actions/action-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

export default function Page() {
  const actionDefinition = DEPRECATED_useActionDefinition();

  if (!actionDefinition) {
    return <SpinnerLoader />;
  }

  return <HistoriqueListeConnected actionId={actionDefinition.id} />;
}
