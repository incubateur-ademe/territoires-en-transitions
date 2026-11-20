import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CollectiviteType } from '@tet/domain/collectivites';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { invitationTable } from '../invitation.table';
import { InvitationService } from '../mutate-invitations/invitation.service';
import {
  ConsumePendingInvitationsError,
  ConsumePendingInvitationsErrorEnum,
} from './consume-pending-invitations.errors';

export const EVENT_INVITATION_CONSUMED_BY_EMAIL =
  'collectivites:invitations:consumed-by-email';

export type ConsumedInvitation = {
  collectiviteId: number;
  collectiviteType: CollectiviteType;
};

/**
 * Reprend les invitations restées en attente parce que leur destinataire a
 * créé son compte sans cliquer le lien du mail — typiquement par ProConnect,
 * dont l'organisation ne mène pas forcément à la collectivité invitante.
 *
 * L'email du compte doit être confirmé : le lien ayant été envoyé à cette
 * boîte, sa maîtrise vaut la même preuve que le lien. Une invitation révoquée
 * n'est plus `pending` et n'est donc jamais reprise.
 */
@Injectable()
export class ConsumePendingInvitationsService {
  private readonly logger = new Logger(ConsumePendingInvitationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly transactionManager: TransactionManager,
    private readonly invitationService: InvitationService,
    private readonly trackingService: TrackingService
  ) {}

  async consume({
    user,
  }: {
    user: AuthenticatedUser;
  }): Promise<Result<ConsumedInvitation[], ConsumePendingInvitationsError>> {
    const userId = user.id;
    try {
      const [compte] = await this.databaseService.db
        .select({
          email: authUsersTable.email,
          emailConfirmedAt: authUsersTable.emailConfirmedAt,
        })
        .from(authUsersTable)
        .where(eq(authUsersTable.id, userId))
        .limit(1);

      if (!compte?.email || !compte.emailConfirmedAt) {
        return success([]);
      }
      const email = compte.email;

      const result = await this.transactionManager.executeSingle<
        ConsumedInvitation[],
        ConsumePendingInvitationsError
      >(async (trx) => {
        // Le verrou sérialise deux reprises simultanées (connexion + filet de
        // « finaliser mon inscription ») : la seconde relit `pending` à faux.
        // Ordre chronologique : à collectivité égale, le droit garde le rôle
        // de la plus récente.
        const invitations = await trx
          .select({
            id: invitationTable.id,
            collectiviteId: invitationTable.collectiviteId,
            role: invitationTable.role,
          })
          .from(invitationTable)
          // Le prédicat de `pending` en clair : sur la colonne générée,
          // l'index partiel `invitation_email_pending_idx` serait ignoré.
          .where(
            and(
              eq(sql`lower(${invitationTable.email})`, email.toLowerCase()),
              isNull(invitationTable.acceptedAt),
              eq(invitationTable.active, true)
            )
          )
          .orderBy(asc(invitationTable.createdAt))
          .for('update');

        if (invitations.length === 0) {
          return success([]);
        }

        // Hors de la requête verrouillante : une jointure y verrouillerait
        // aussi la collectivité, et Drizzle ne sait pas restreindre le verrou
        // à une table d'un autre schéma (`for update of` non qualifié).
        const collectivites = await trx
          .select({ id: collectiviteTable.id, type: collectiviteTable.type })
          .from(collectiviteTable)
          .where(
            inArray(
              collectiviteTable.id,
              invitations.map(({ collectiviteId }) => collectiviteId)
            )
          );
        const typeParCollectivite = new Map(
          collectivites.map(({ id, type }) => [id, type])
        );

        for (const invitation of invitations) {
          await this.invitationService.applyInvitation(invitation, userId, trx);
          this.logger.log(
            `Invitation ${invitation.id} reprise par email pour le compte ${userId} (collectivité #${invitation.collectiviteId})`
          );
        }

        const reprises = new Map<number, ConsumedInvitation>();
        for (const { collectiviteId } of invitations) {
          const collectiviteType = typeParCollectivite.get(collectiviteId);
          if (collectiviteType) {
            reprises.set(collectiviteId, { collectiviteId, collectiviteType });
          }
        }
        return success([...reprises.values()]);
      });

      if (result.success) {
        for (const { collectiviteId } of result.data) {
          this.trackingService.capture({
            distinctId: userId,
            event: EVENT_INVITATION_CONSUMED_BY_EMAIL,
            properties: { collectiviteId },
            groups: { collectivite: String(collectiviteId) },
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Reprise des invitations en attente du compte ${userId} interrompue`,
        error
      );
      return failure(
        ConsumePendingInvitationsErrorEnum.CONSUME_PENDING_INVITATIONS_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }
}
