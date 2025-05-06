'use client';

import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';

export default function Page() {
  return (
    <IndicateursListView
      listId="collectivite"
      defaultFilters={{ estFavorisCollectivite: true }}
    />
  );
}
