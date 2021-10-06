import {FunctionnalitiesUsageProportionBarChart} from 'app/pages/statistics/FunctionnalitiesUsageProportionBarChart';
import {
  getDailyCollectiviteCounts,
  getDailyUserCounts,
} from 'core-logic/api/statisticsApiEndpoints';
import {DailyCountLineChart} from './DailyCountLineChart';

const StatisticsPage = () => {
  console.log('StatisticsPage');
  return (
    <section className="max-w-2xl mx-auto p-5">
      <h1 className="fr-h1">Statistiques de Territoires en Transitions</h1>

      <p>
        Découvrez ici les statistiques de déploiement et d'utilisation de la
        plateforme Territoires en Transitions
      </p>

      <h2 className="fr-h2">Utilisateurs et collectivités</h2>
      <div className="flex justify-evenly">
        <DailyCountLineChart
          unit="month"
          chartTitle="Nombre de collectivités utilisatrices"
          yAxisTitle="nombre de collectivités"
          getDailyCount={getDailyCollectiviteCounts}
          yMin={0}
        />
        <DailyCountLineChart
          unit="month"
          chartTitle="Nombre de personnes utilisatrices"
          yAxisTitle="nombre de comptes"
          getDailyCount={getDailyUserCounts}
          yMin={0}
        />
      </div>
      <h2 className="fr-h2">Utilisation des fonctionnalités</h2>
      <FunctionnalitiesUsageProportionBarChart
        chartTitle="Proportion de collectivités qui utilisent les fonctionnalités"
        yAxisTitle="% des collectivités utilisatrices"
        xAxisTitle="fonctionnalités"
      />
    </section>
  );
};

export default StatisticsPage;
