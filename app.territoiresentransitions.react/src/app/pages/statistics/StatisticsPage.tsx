import {FunctionnalitiesUsageProportionBarChart} from 'app/pages/statistics/FunctionnalitiesUsageProportionBarChart';
import {
  getDailyCAEActionStatusCreatedCount,
  getDailyCollectiviteCounts,
  getDailyECIActionStatusCreatedCount,
  getDailyFicheActionCreatedCount,
  getDailyIndicateurPersonnaliseValueCount,
  getDailyCAEIndicateurReferentielValueCount,
  getDailyECIIndicateurReferentielValueCount,
  getDailyUserCounts,
} from 'core-logic/api/statisticsApiEndpoints';
import {DailyCountLineChart} from './DailyCountLineChart';

const StatisticsPage = () => {
  return (
    <div className="app fr-container m-5">
      <section>
        <h1 className="fr-h1">Statistiques de Territoires en Transitions</h1>

        <p>
          Découvrez ici les statistiques de déploiement et d'utilisation de la
          plateforme Territoires en Transitions
        </p>

        <h2 className="fr-h2">Utilisateurs et collectivités</h2>
        <div className="flex justify-start gap-12">
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
        <h3 className="fr-h3 mb-4">Référentiels</h3>

        <div className="flex justify-start gap-12">
          <div>
            <div className="text-lg font-bold">Climat-Air-Énergie (CAE)</div>
            <DailyCountLineChart
              unit="month"
              chartTitle="Nombre d'actions CAE renseignées"
              yAxisTitle="nombre d'actions"
              getDailyCount={getDailyCAEActionStatusCreatedCount}
              yMin={0}
            />
            <DailyCountLineChart
              unit="month"
              chartTitle="Indicateurs CAE"
              yAxisTitle="nombre d'indicateurs renseignés"
              getDailyCount={getDailyCAEIndicateurReferentielValueCount}
              yMin={0}
            />
          </div>
          <div>
            <div className="text-lg font-bold">Économie Circulaire (ECI) </div>
            <DailyCountLineChart
              unit="month"
              chartTitle="Nombre d'actions ECI renseignées"
              yAxisTitle="nombre d'actions"
              getDailyCount={getDailyECIActionStatusCreatedCount}
              yMin={0}
            />
            <DailyCountLineChart
              unit="month"
              chartTitle="Indicateurs ECI"
              yAxisTitle="nombre d'indicateurs renseignés"
              getDailyCount={getDailyECIIndicateurReferentielValueCount}
              yMin={0}
            />
          </div>
        </div>

        <h3 className="fr-h3">Plan d'actions</h3>
        <div className="flex justify-start">
          <DailyCountLineChart
            unit="month"
            chartTitle="Fiches actions"
            yAxisTitle="nombre de fiches actions"
            getDailyCount={getDailyFicheActionCreatedCount}
            yMin={0}
          />
        </div>
        <div className="flex justify-start">
          <DailyCountLineChart
            unit="month"
            chartTitle="Indicateurs personnalisés"
            yAxisTitle="nombre d'indicateurs créés"
            getDailyCount={getDailyIndicateurPersonnaliseValueCount}
            yMin={0}
          />
        </div>
      </section>
    </div>
  );
};

export default StatisticsPage;
