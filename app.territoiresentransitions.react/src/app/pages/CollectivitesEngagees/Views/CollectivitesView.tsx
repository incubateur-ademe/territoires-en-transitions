import View, {
  CollectivitesEngageesView,
} from 'app/pages/CollectivitesEngagees/Views/View';
import {CollectiviteCarte} from 'app/pages/CollectivitesEngagees/Views/CollectiviteCarte';
import {
  TCollectiviteCarte,
  useFilteredCollectivites,
} from 'app/pages/CollectivitesEngagees/data/useFilteredCollectivites';

const CollectivitesView = (props: CollectivitesEngageesView) => {
  /** Data */
  const {collectivites, collectivitesCount, isLoading} =
    useFilteredCollectivites(props.filters);

  return (
    <View
      {...props}
      view="collectivite"
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
      renderCard={data => {
        const collectivite = data as TCollectiviteCarte;
        return (
          <CollectiviteCarte
            key={collectivite.collectivite_id}
            collectivite={collectivite}
            canUserClickCard={props.canUserClickCard}
          />
        );
      }}
    />
  );
};

export default CollectivitesView;
