import {useIntersectionObserver} from 'utils/useIntersectionObserver';
import {TIndicateurListItem} from 'app/pages/collectivite/Indicateurs/types';
import IndicateurChart from 'app/pages/collectivite/Indicateurs/charts/IndicateurChart';
import {TIndicateurChartProps} from 'app/pages/collectivite/Indicateurs/charts/types';

type TIndicateurChartsGridProps = {
  definitions: TIndicateurListItem[];
};

/** Affiche une grille de graphiques d'indicateur */
const IndicateurChartsGrid = (props: TIndicateurChartsGridProps) => {
  const {definitions} = props;

  return (
    <div className="flex flex-col gap-6">
      {definitions?.map(definition => (
        <IndicateurChartContainer key={definition.id} definition={definition} />
      ))}
    </div>
  );
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (props: TIndicateurChartProps) => {
  const {ref, entry} = useIntersectionObserver();
  const {definition} = props;

  return (
    <div className="h-80" ref={ref}>
      {entry?.isIntersecting ? <IndicateurChart {...props} /> : definition.nom}
    </div>
  );
};

export default IndicateurChartsGrid;
