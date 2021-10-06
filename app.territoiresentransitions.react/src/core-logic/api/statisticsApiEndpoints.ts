import {defaultAuthorization} from 'core-logic/api/hybridStores';
import {ENV} from 'environmentVariables';

// Models
export type DailyCount = {
  date: string;
  count: number;
  cumulated_count: number;
};

export type FunctionnalitiesUsageProportion = {
  fiche_action: number;
  eci_referentiel: number;
  cae_referentiel: number;
  indicateur_personnalise: number;
  inficateur_referentiel: number;
};

const makeGetStatistics = <T>(endpoint: string) => {
  const getStatistics = async () => {
    const response_json = await fetch(
      `${ENV.backendHost}/v2/statistics/${endpoint}`,
      {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Authorization: defaultAuthorization(),
        },
      }
    ).then(response => response.json());

    console.log(response_json);
    return response_json as T;
  };
  return getStatistics;
};

export const getDailyUserCounts =
  makeGetStatistics<DailyCount[]>('daily_user_count');

export const getDailyCollectiviteCounts = makeGetStatistics<DailyCount[]>(
  'daily_collectivite_count'
);

export const getFunctionnalitiesUsageProportion =
  makeGetStatistics<FunctionnalitiesUsageProportion>(
    'functionnalities_usage_proportion'
  );
