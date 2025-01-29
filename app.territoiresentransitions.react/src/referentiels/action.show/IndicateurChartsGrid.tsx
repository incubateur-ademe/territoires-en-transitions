import IndicateurCard, {
  IndicateurCardProps,
} from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
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

  return (
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
      {definitions?.map((definition) => (
        <IndicateurChartContainer
          key={definition.id}
          definition={definition}
          view={view}
        />
      ))}
    </div>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: IndicateurCardProps & { view: IndicateurViewParamOption }
) => {
  const { ref, entry } = useIntersectionObserver();
  const collectiviteId = useCollectiviteId()!;
  const isReadonly = useCurrentCollectivite()?.isReadOnly ?? true;

  const { definition, view } = props;
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
          readonly={isReadonly}
        />
      ) : (
        definition.titre
      )}
    </div>
  );
};

export default IndicateurChartsGrid;
