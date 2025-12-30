'use client';

import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';
import { getFiltersForPersonalizedIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';

export default function Page() {
  return (
    <IndicateursListView
      listId="perso"
      defaultFilters={getFiltersForPersonalizedIndicateurs()}
    />
  );
}
