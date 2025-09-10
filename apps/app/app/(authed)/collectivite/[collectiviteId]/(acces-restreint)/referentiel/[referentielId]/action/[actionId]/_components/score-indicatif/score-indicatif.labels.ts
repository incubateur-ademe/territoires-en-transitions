import { TypeScoreIndicatif } from '@/domain/referentiels';

export const typeScoreToLabel: Record<TypeScoreIndicatif, string> = {
  fait: 'Résultats de la collectivités',
  programme: 'Objectifs de la collectivité',
};

export const typeScoreToShortLabel: Record<TypeScoreIndicatif, string> = {
  fait: 'Résultat',
  programme: 'Objectif',
};

export const typeScoreToName: Record<TypeScoreIndicatif, string> = {
  fait: 'fait',
  programme: 'programmé',
};
