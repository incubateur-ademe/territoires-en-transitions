'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useFilteredIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import IndicateurChartsGrid from '@/app/referentiels/action.show/IndicateurChartsGrid';
import { useActionId } from '@/app/referentiels/actions/action-context';
import { getReferentielIdFromActionId } from '@/domain/referentiels';

export default function Page() {
  const collectivite = useCurrentCollectivite();
  const actionId = useActionId();

  const { data: indicateursLies } = useFilteredIndicateurDefinitions({
    filtre: {
      actionId,
      withChildren: true,
    },
  });

  // le contenu de l'onglet Indicateurs n'est pas affiché
  // si la collectivité est en accès restreint
  if (collectivite.accesRestreint && collectivite.niveauAcces === null) {
    return null;
  }

  return (
    <section>
      {indicateursLies?.length === 0 ? (
        <p>{"Cette action ne comporte pas d'indicateur"}</p>
      ) : (
        <IndicateurChartsGrid
          definitions={indicateursLies}
          view={getReferentielIdFromActionId(actionId)}
        />
      )}
    </section>
  );
}
