import { RecherchesReferentiel } from '@/api/collectiviteEngagees';
import { CollectiviteCarte } from '@/app/app/pages/CollectivitesEngagees/Views/CollectiviteCarte';
import View, {
  CollectivitesEngageesView,
} from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { useFilteredCollectivites } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredCollectivites';

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
        const collectivite = data as RecherchesReferentiel;
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
