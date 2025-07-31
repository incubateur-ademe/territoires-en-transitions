'use client';

import { useUser } from '@/api/users/user-provider';
import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';

export default function Page() {
  const user = useUser();

  return (
    <IndicateursListView
      listId="mes-indicateurs"
      defaultFilters={{ utilisateurPiloteIds: [user.id] }}
    />
  );
}
