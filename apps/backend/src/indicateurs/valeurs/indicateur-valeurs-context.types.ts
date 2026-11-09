import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { AuthUser } from '../../users/models/auth.models';

export type IndicateurValeursContext<User extends AuthUser = AuthUser> =
  | Readonly<{
      user: User;
      isUserTrusted?: false;
      tx?: Transaction;
      /** Granted internally after authorizing the PCAET démarche; never a request field. */
      pcaetMetadataAuthorization?: Readonly<{
        collectiviteId: number;
        metadonneeId: number;
      }>;
    }>
  | Readonly<{
      /** The caller has already authorized this use case. */
      isUserTrusted: true;
      user?: User;
      tx?: Transaction;
      /**
       * Décision du flag SNBC 3 déjà prise par l'appelant, pour un traitement
       * en arrière-plan qui n'a pas d'utilisateur (rapport PPT). Sinon, le
       * flag est évalué avec `user`.
       */
      trajectoireSnbc3Enabled?: boolean;
    }>;

export type IndicateurValeursWriteContext = IndicateurValeursContext & {
  tx: Transaction;
};
