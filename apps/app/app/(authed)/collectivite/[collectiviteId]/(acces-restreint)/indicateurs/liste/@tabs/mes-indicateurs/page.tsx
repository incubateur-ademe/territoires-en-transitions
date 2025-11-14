'use client';

import { useUser } from '@/api/users';
import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';
import { getFiltersForMyIndicateurs } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';

export default function Page() {
  const user = useUser();

  return (
    <IndicateursListView
      listId="mes-indicateurs"
      defaultFilters={getFiltersForMyIndicateurs(user.id)}
    />
  );
}
