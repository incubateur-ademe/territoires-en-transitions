import { RouterOutput } from '@/api';

export type ScoreIndicatifAction =
  RouterOutput['referentiels']['actions']['getScoreIndicatif'][string];

export type ScoreIndicatifValeurUtilisee = NonNullable<
  NonNullable<ScoreIndicatifAction>['fait']
>['valeursUtilisees'][number];

export type ScoreIndicatifValeursUtilisables =
  RouterOutput['referentiels']['actions']['getValeursUtilisables'];

export type ScoreIndicatifValeursUtilisees =
  RouterOutput['referentiels']['actions']['getValeursUtilisees'][string];

export type ScoreIndicatifValeursIndicateur =
  ScoreIndicatifValeursUtilisables[number]['indicateurs'][number];
