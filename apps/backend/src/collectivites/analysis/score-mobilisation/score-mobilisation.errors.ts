import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LevierId } from '@tet/domain/shared';

type UnscoredLevier = {
  levierId: LevierId;
  kind: LlmError['kind'];
};

export type CalculateCollectiviteMobilisationError =
  | { readonly kind: 'collectivite_not_found'; readonly collectiviteId: number }
  | {
      readonly kind: 'leviers_not_scored';
      readonly collectiviteId: number;
      readonly unscored: readonly UnscoredLevier[];
    };
