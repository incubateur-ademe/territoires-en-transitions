import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { AuthUser } from '../../users/models/auth.models';

export type IndicateurValeursContext<User extends AuthUser = AuthUser> =
  | Readonly<{
      user: User;
      isUserTrusted?: false;
      tx?: Transaction;
      /**
       * Granted by the owning workflow after checking its rights and exact
       * metadata association. Never built from request fields alone.
       */
      metadataAuthorization?: Readonly<{
        collectiviteId: number;
        metadonneeId: number;
        sourceId: string;
      }>;
    }>
  | Readonly<{
      /** The caller has already authorized this use case. */
      isUserTrusted: true;
      user?: User;
      tx?: Transaction;
    }>;

export type IndicateurValeursWriteContext = IndicateurValeursContext & {
  tx: Transaction;
};
