import { ScoreIndicatifType } from '@tet/domain/referentiels';

export const typeScoreToLabel: Record<ScoreIndicatifType, string> = {
  fait: 'Résultats de la collectivité',
  programme: 'Objectifs de la collectivité',
};

export const typeScoreToShortLabel: Record<ScoreIndicatifType, string> = {
  fait: 'Résultat',
  programme: 'Objectif',
};

export const typeScoreToName: Record<ScoreIndicatifType, string> = {
  fait: 'fait',
  programme: 'programmé',
};
