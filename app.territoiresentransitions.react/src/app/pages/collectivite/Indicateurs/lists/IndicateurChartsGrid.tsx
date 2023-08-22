import {Link} from 'react-router-dom';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIntersectionObserver} from 'utils/useIntersectionObserver';
import IndicateurChart from '../charts/IndicateurChart';
import {TIndicateurChartProps} from '../charts/types';
import {TIndicateurDefinition, TIndicateurProgramme} from '../types';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';

type TIndicateurChartsGridProps = {
  definitions: TIndicateurDefinition[];
  view?: IndicateurViewParamOption;
};

/** Affiche une grille de graphiques d'indicateur */
const IndicateurChartsGrid = (props: TIndicateurChartsGridProps) => {
  const {definitions, view} = props;

  return (
    <div className="grid lg:grid-cols-2 gap-x-6 gap-y-8">
      {definitions?.map(definition => (
        <IndicateurChartContainer
          key={definition.id}
          definition={definition}
          view={view}
        />
      ))}
    </div>
  );
};

// renvoi la vue par défaut associée à une définition d'indicateur (pour construire son url)
const VUES_PROGRAMME = ['cae', 'eci', 'crte'];
const getViewId = (definition: TIndicateurDefinition) => {
  // indicateur perso
  if (definition.isPerso) return 'perso';

  // indicateur faisant partie d'un programme avec une vue associée
  const vue = VUES_PROGRAMME.find(g =>
    definition.programmes.includes(g as TIndicateurProgramme)
  );
  if (vue) return vue as IndicateurViewParamOption;

  // indicateur clé
  if (definition.programmes?.includes('clef')) return 'cles';

  // par défaut => vue "sélection"
  /* if (definition.selection) */ return 'selection';
};

/** Affiche le graphique uniquement lorsque son conteneur devient visible */
const IndicateurChartContainer = (
  props: TIndicateurChartProps & {view?: IndicateurViewParamOption}
) => {
  const {ref, entry} = useIntersectionObserver();
  const collectiviteId = useCollectiviteId()!;

  const {definition, view} = props;
  const url = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: view || getViewId(definition),
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
