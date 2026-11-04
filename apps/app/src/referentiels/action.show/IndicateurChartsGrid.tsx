import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';
import { useCurrentCollectivite } from '@tet/api/collectivites';

type TIndicateurChartsGridProps = {
  indicateurs: IndicateurDetaille[];
  view: IndicateurViewParamOption;
};

/**
 * Affiche une grille de graphiques d'indicateur.
 * Les données des graphiques sont chargées dynamiquement lorsqu'ils deviennent visibles à l'écran.
 */
const IndicateurChartsGrid = (props: TIndicateurChartsGridProps) => {
  const { indicateurs, view } = props;
  const collectivite = useCurrentCollectivite();
  const referentielId = useReferentielId();

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8">
      {indicateurs?.map((indicateur) => (
        <IndicateurChartContainer
          key={indicateur.id}
          indicateur={indicateur}
          view={view}
          isReadOnly={
            !collectivite.hasReferentielPermission(
              'referentiels.mutate',
              referentielId
            )
          }
          collectiviteId={collectivite.collectiviteId}
        />
      ))}
    </div>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: IndicateurCardProps & {
    view: IndicateurViewParamOption;
    isReadOnly: boolean;
    collectiviteId: number;
  }
) => {
  const { ref, entry } = useIntersectionObserver();

  const { indicateur, view, isReadOnly, collectiviteId } = props;
  const url = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: view,
    indicateurId: indicateur.id,
    identifiantReferentiel: indicateur.identifiantReferentiel,
  });

  return (
    <div className="min-h-[20rem]" ref={ref}>
      {entry?.isIntersecting ? (
        <IndicateurCard
          href={url}
          className="h-full"
          indicateur={indicateur}
          readonly={isReadOnly}
        />
      ) : (
        indicateur.titre
      )}
    </div>
  );
};

export default IndicateurChartsGrid;
