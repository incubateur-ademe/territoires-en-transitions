import { LlmError } from '@tet/backend/utils/llm/llm.errors';
import { LevierId } from '@tet/domain/shared';
import { createEnumObject } from '@tet/domain/utils';

const collectiviteIdentityErrorValues = [
  'COLLECTIVITE_NOT_FOUND',
  'GET_COLLECTIVITE_IDENTITY_ERROR',
] as const;

export const CollectiviteIdentityErrorEnum = createEnumObject(
  collectiviteIdentityErrorValues
);

export type CollectiviteIdentityError =
  (typeof collectiviteIdentityErrorValues)[number];

type UnscoredLevier = {
  levierId: LevierId;
  kind: LlmError['kind'];
};

export type CalculateCollectiviteMobilisationError =
  | { readonly kind: 'collectivite_not_found'; readonly collectiviteId: number }
  | {
      readonly kind: 'collectivite_read_failed';
      readonly collectiviteId: number;
    }
  | {
      readonly kind: 'leviers_not_scored';
      readonly collectiviteId: number;
      readonly unscored: readonly UnscoredLevier[];
    };
