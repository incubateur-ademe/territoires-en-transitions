import { RecherchesReferentiel } from '@/api/collectiviteEngagees';
import View, {
  CollectivitesEngageesView,
} from '@/app/app/pages/CollectivitesEngagees/Views/View';
import { useFilteredReferentiels } from '@/app/app/pages/CollectivitesEngagees/data/useFilteredReferentiels';
import { ReferentielCarte } from './ReferentielCarte';

const ReferentielsView = (props: CollectivitesEngageesView) => {
  /** Data */
  const { collectivites, collectivitesCount, isLoading } =
    useFilteredReferentiels(props.filters);

  return (
    <View
      {...props}
      view="referentiels"
      data={collectivites}
      dataCount={collectivitesCount}
      isLoading={isLoading}
      renderCard={(data) => {
        const collectivite = data as RecherchesReferentiel;
        return (
          <ReferentielCarte
            key={collectivite.collectiviteId}
            collectivite={collectivite}
            canUserClickCard={props.canUserClickCard}
          />
        );
      }}
    />
  );
};

export default ReferentielsView;
