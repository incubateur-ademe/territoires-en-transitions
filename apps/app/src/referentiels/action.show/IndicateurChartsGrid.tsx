import {
  useCollectiviteId,
  useGetCurrentCollectivite,
} from '@/api/collectivites';
import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';
import { TIndicateurListItem } from '../../app/pages/collectivite/Indicateurs/types';

type TIndicateurChartsGridProps = {
  definitions: TIndicateurListItem[];
  view: IndicateurViewParamOption;
};

/**
 * Affiche une grille de graphiques d'indicateur.
 * Les données des graphiques sont chargées dynamiquement lorsqu'ils deviennent visibles à l'écran.
 */
const IndicateurChartsGrid = (props: TIndicateurChartsGridProps) => {
  const { definitions, view } = props;
  const collectiviteId = useCollectiviteId();
  const collectivite = useGetCurrentCollectivite(collectiviteId)!;
  if (!collectivite) return null;

  return (
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
      {definitions?.map((definition) => (
        <IndicateurChartContainer
          key={definition.id}
          definition={definition}
          view={view}
          isReadOnly={collectivite.isReadOnly ?? false}
          collectiviteId={collectiviteId}
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

  const { definition, view, isReadOnly, collectiviteId } = props;
  const url = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: view,
    indicateurId: definition.id,
    identifiantReferentiel: definition.identifiant,
  });

  return (
    <div className="min-h-[20rem]" ref={ref}>
      {entry?.isIntersecting ? (
        <IndicateurCard
          href={url}
          className="h-full"
          definition={definition}
          readonly={isReadOnly}
        />
      ) : (
        definition.titre
      )}
    </div>
  );
};

export default IndicateurChartsGrid;
