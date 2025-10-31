'use client';

import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';
import { getFiltersForIndicateurClefs } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';

export default function Page() {
  return (
    <IndicateursListView
      listId="cles"
      defaultFilters={getFiltersForIndicateurClefs()}
    />
  );
}
