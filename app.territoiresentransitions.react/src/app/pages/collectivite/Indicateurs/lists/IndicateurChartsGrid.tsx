import {Link} from 'react-router-dom';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIntersectionObserver} from 'utils/useIntersectionObserver';
import IndicateurChart from '../charts/IndicateurChart';
import {TIndicateurChartProps} from '../charts/types';
import {
  TIndicateurDefinition,
  TIndicateurReferentielDefinition,
} from '../types';
import {makeCollectiviteIndicateursUrl} from 'app/paths';

type TIndicateurChartsGridProps = {
  definitions: TIndicateurDefinition[];
};

/** Affiche une grille de graphiques d'indicateur */
const IndicateurChartsGrid = (props: TIndicateurChartsGridProps) => {
  const {definitions} = props;

  return (
    <div className="grid lg:grid-cols-2 gap-x-6 gap-y-8">
      {definitions?.map(definition => (
        <IndicateurChartContainer key={definition.id} definition={definition} />
      ))}
    </div>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (props: TIndicateurChartProps) => {
  const {ref, entry} = useIntersectionObserver();
  const collectiviteId = useCollectiviteId()!;

  const {definition} = props;
  const url = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: definition.isPerso
      ? 'perso'
      : (definition as TIndicateurReferentielDefinition).groupe,
    indicateurId: definition.id,
  });

  return (
    <div className="h-80" ref={ref}>
      {entry?.isIntersecting && (
        <Link to={url} className="focus-visible:ring">
          <IndicateurChart {...props} />
        </Link>
      )}
    </div>
  );
};

export default IndicateurChartsGrid;
