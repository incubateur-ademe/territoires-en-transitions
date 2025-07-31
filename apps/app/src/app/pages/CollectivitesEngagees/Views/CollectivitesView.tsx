import { RecherchesCollectivite } from '@/api/collectiviteEngagees';
import View, {
  CollectivitesEngageesView,
} from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { useFilteredCollectivites } from '../data/useFilteredCollectivites';
import { CollectiviteCarte } from './CollectiviteCarte';

const CollectivitesView = (props: CollectivitesEngageesView) => {
  /** Data */
  const { collectivites, collectivitesCount, isLoading } =
    useFilteredCollectivites(props.filters);

  return (
    <View
      {...props}
      view="collectivites"
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
      renderCard={(data) => {
        const collectivite = data as RecherchesCollectivite;
        return (
          <CollectiviteCarte
            key={collectivite.collectiviteId}
            collectivite={collectivite}
            canUserClickCard={props.canUserClickCard}
          />
        );
      }}
    />
  );
};

export default CollectivitesView;
