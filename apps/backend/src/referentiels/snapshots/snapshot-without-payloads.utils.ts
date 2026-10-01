import {
  ScoreSnapshot,
  SnapshotWithoutPayloads,
} from '@tet/domain/referentiels';
import { omit } from 'es-toolkit';

/**
 * Retire les payloads JSON (scores des actions, réponses de personnalisation)
 * d'un snapshot : ils pèsent plus d'1 Mo sur les gros référentiels et le front
 * n'en a pas besoin dans la réponse des mutations qui recalculent le score
 * (il recharge `listActionsGroupedById`).
 */
export const toSnapshotWithoutPayloads = (
  snapshot: ScoreSnapshot
): SnapshotWithoutPayloads =>
  omit(snapshot, ['scoresPayload', 'personnalisationReponses']);
