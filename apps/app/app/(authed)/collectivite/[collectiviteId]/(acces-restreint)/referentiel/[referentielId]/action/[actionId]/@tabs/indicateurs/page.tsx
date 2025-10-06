'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useListIndicateurDefinitions } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import IndicateurChartsGrid from '@/app/referentiels/action.show/IndicateurChartsGrid';
import { useActionId } from '@/app/referentiels/actions/action-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { getReferentielIdFromActionId } from '@/domain/referentiels';

export default function Page() {
  const collectivite = useCurrentCollectivite();
  const mesureId = useActionId();

  const { data: { data: indicateursLies } = {}, isLoading } =
    useListIndicateurDefinitions({
      filters: {
        mesureId,
      },
    });

  // le contenu de l'onglet Indicateurs n'est pas affiché
  // si la collectivité est en accès restreint
  if (collectivite.accesRestreint && collectivite.niveauAcces === null) {
    return null;
  }

  if (isLoading) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <section>
      {!indicateursLies || indicateursLies?.length === 0 ? (
        <p>{"Cette action ne comporte pas d'indicateur"}</p>
      ) : (
        <IndicateurChartsGrid
          definitions={indicateursLies}
          view={getReferentielIdFromActionId(mesureId)}
        />
      )}
    </section>
  );
}
