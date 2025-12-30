import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import { IndicateurDefinitionListItem } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useIntersectionObserver } from '@/app/utils/useIntersectionObserver';
import { useCurrentCollectivite } from '@tet/api/collectivites';

type TIndicateurChartsGridProps = {
  definitions: IndicateurDefinitionListItem[];
  view: IndicateurViewParamOption;
};

/**
 * Affiche une grille de graphiques d'indicateur.
 * Les données des graphiques sont chargées dynamiquement lorsqu'ils deviennent visibles à l'écran.
 */
const IndicateurChartsGrid = (props: TIndicateurChartsGridProps) => {
  const { definitions, view } = props;
  const collectivite = useCurrentCollectivite();

  return (
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
      {definitions?.map((definition) => (
        <IndicateurChartContainer
          key={definition.id}
          definition={definition}
          view={view}
          isReadOnly={collectivite.isReadOnly ?? false}
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

  const { definition, view, isReadOnly, collectiviteId } = props;
  const url = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: view,
    indicateurId: definition.id,
    identifiantReferentiel: definition.identifiantReferentiel,
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
