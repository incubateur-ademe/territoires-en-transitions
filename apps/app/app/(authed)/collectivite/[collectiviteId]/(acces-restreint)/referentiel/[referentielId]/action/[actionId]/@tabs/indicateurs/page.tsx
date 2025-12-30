'use client';

import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import IndicateurChartsGrid from '@/app/referentiels/action.show/IndicateurChartsGrid';
import { useActionId } from '@/app/referentiels/actions/action-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

export default function Page() {
  const collectivite = useCurrentCollectivite();
  const mesureId = useActionId();

  const { data: { data: indicateursLies } = {}, isLoading } =
    useListIndicateurs({
      collectiviteId: collectivite.collectiviteId,
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
