'use client';

import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';
import { getFiltersForMyIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useUser } from '@tet/api/users';

export default function Page() {
  const user = useUser();

  return (
    <IndicateursListView
      listId="mes-indicateurs"
      defaultFilters={getFiltersForMyIndicateurs(user.id)}
    />
  );
}
