import {
  CompletenessSlice,
  DailyCount,
  FunctionnalitiesUsageProportion,
} from 'core-logic/api/statisticsApiEndpoints';
import {CompletenessSlicesChart} from './CompletenessSlicesChart';
import {DailyCountLineChart} from './DailyCountLineChart';
import {FeaturesUseBarChart} from './FeaturesUseBarChart';

export type TStatisticsPageProps = {
  rattachements: DailyCount[] | null;
  activeCollectivites: DailyCount[] | null;
  activeUsers: DailyCount[] | null;
  proportions: FunctionnalitiesUsageProportion | null;
  slices: CompletenessSlice[] | null;
};

export const StatisticsPage = (props: TStatisticsPageProps) => {
  const {rattachements, activeCollectivites, activeUsers, proportions, slices} =
    props;

  return (
    <div className="app fr-container m-5">
      <section>
        <h1 className="fr-h1">Statistiques de Territoires en Transitions</h1>

        <p>
          Découvrez ici les statistiques de déploiement et d'utilisation de la
          plateforme Territoires en Transitions
        </p>

        <h3 className="fr-h3 py-2">Utilisateurs actifs</h3>
        {activeUsers ? (
          <DailyCountLineChart
            widthPx={650}
            dailyCounts={activeUsers}
            yTitle="Nombre d'utilisateurs actifs"
            title1="Nouveaux utilisateurs"
            title2="Cumul des utilisateurs"
          />
        ) : (
          '...'
        )}

        <h3 className="fr-h3 py-2">Collectivités actives</h3>
        {activeCollectivites ? (
          <DailyCountLineChart
            widthPx={650}
            dailyCounts={activeCollectivites}
            yTitle="Nombre de collectivités actives"
            title1="Nouvelles collectivités"
            title2="Cumul des collectivités"
          />
        ) : (
          '...'
        )}

        <h3 className="fr-h3 py-2">Rattachements utilisateur/collectivité</h3>
        {rattachements ? (
          <DailyCountLineChart
            widthPx={650}
            dailyCounts={rattachements}
            yTitle="Utilisateurs rattachés à une collectivité"
            title1="Nouveaux rattachements"
            title2="Cumul des rattachements"
          />
        ) : (
          '...'
        )}

        <h3 className="fr-h3 pt-8 pb-2">
          Pourcentage des collectivités actives qui utilisent les
          fonctionnalités
        </h3>
        {proportions ? (
          <FeaturesUseBarChart proportions={proportions} widthPx={650} />
        ) : (
          '...'
        )}

        <h3 className="fr-h3 pt-8">Référentiels</h3>
        <h4 className="fr-h4">
          Part des collectivités par tranche de complétude pour chaque
          référentiel
        </h4>
        {slices ? (
          <div className="flex justify-start gap-12">
            <CompletenessSlicesChart
              referentiel="eci"
              slices={slices}
              widthPx={350}
            />
            <CompletenessSlicesChart
              referentiel="cae"
              slices={slices}
              widthPx={350}
            />
          </div>
        ) : (
          '...'
        )}
      </section>
    </div>
  );
};
