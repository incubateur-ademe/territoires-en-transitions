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
    const response_json = await fetch(`TODO`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: '',
      },
    }).then(response => response.json());

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

export const getDailyCAEIndicateurReferentielValueCount = makeGetStatistics<
  DailyCount[]
>('daily_indicateur_referentiel_count/cae');

export const getDailyECIIndicateurReferentielValueCount = makeGetStatistics<
  DailyCount[]
>('daily_indicateur_referentiel_count/eci');

export const getDailyIndicateurPersonnaliseValueCount = makeGetStatistics<
  DailyCount[]
>('daily_indicateur_personnalise_count');

export const getDailyFicheActionCreatedCount = makeGetStatistics<DailyCount[]>(
  'daily_fiche_action_created_count'
);

export const getDailyCAEActionStatusCreatedCount = makeGetStatistics<
  DailyCount[]
>('daily_action_referentiel_status_count/cae');

export const getDailyECIActionStatusCreatedCount = makeGetStatistics<
  DailyCount[]
>('daily_action_referentiel_status_count/eci');
