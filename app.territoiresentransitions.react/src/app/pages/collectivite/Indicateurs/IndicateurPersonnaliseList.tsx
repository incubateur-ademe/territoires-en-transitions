import FuzzySearch from 'fuzzy-search';
import {IndicateurPersonnaliseCard} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseCard';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useIndicateursPersoDefinitions} from './useIndicateursPersoDefinitions';

export const IndicateurPersonnaliseList = (props: {
  showOnlyIndicateurWithData: boolean;
  pattern: string;
}) => {
  const {showOnlyIndicateurWithData, pattern} = props;
  const collectiviteId = useCollectiviteId()!;

  const {data: indicateurs} = useIndicateursPersoDefinitions(collectiviteId);
  const titreSearcher = new FuzzySearch(indicateurs || [], ['titre'], {
    sort: true,
  });
  const filteredIndicateurs = pattern ? titreSearcher.search(pattern) : null;

  return (
    <section className="flex flex-col">
      {(filteredIndicateurs || indicateurs)?.map(indicateur => (
        <IndicateurPersonnaliseCard
          indicateur={indicateur}
          key={indicateur.id}
          hideIfNoValues={showOnlyIndicateurWithData}
        />
      ))}
    </section>
  );
};
