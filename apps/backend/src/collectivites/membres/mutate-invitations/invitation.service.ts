import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
import { PersonneTagService } from '@tet/backend/collectivites/tags/personnes/personne-tag.service';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { UpdateUserRoleService } from '../../../users/authorizations/update-user-role/update-user-role.service';
import { utilisateurCollectiviteAccessTable } from '../../../users/authorizations/utilisateur-collectivite-access.table';
import { invitationTable } from '../invitation.table';
import { CreateInvitationInput } from './create-invitation.input';
import { invitationPersonneTagTable } from './invitation-personne-tag.table';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personneTagService: PersonneTagService,
    private readonly listMembresService: ListMembresService,
    private readonly roleUpdateService: UpdateUserRoleService
  ) {}

  async createInvitation(
    invitation: CreateInvitationInput,
    user: AuthenticatedUser
  ): Promise<{
    id: string;
    acceptanceToken: string;
  } | null> {
    // Vérifie si l'utilisateur invité existe déjà à partir de son adresse mail
    const [invitedUser] = await this.databaseService.db
      .select()
      .from(dcpTable)
      // Comparaison insensible à la casse : l'email d'entrée est normalisé,
      // pas forcément celui que `dcp` a hérité de `auth.users`.
      .where(eq(sql`lower(${dcpTable.email})`, invitation.email))
      .limit(1);

    if (invitedUser) {
      // Si l'utilisateur existe déjà, vérifie s'il est déjà attaché à la collectivité
      const isMember = await this.listMembresService.isActiveMember({
        userId: invitedUser.id,
        collectiviteId: invitation.collectiviteId,
      });
      // S'il est déjà attaché, erreur, sinon, on le rattache ou le réactive
      if (isMember) {
        throw new Error(
          `L'utilisateur ${invitation.email} est déjà associé à la collectivité ${invitation.collectiviteId}`
        );
      } else {
        return await this.databaseService.db.transaction(async (trx) => {
          // Ajoute ou met à jour l'utilisateur dans la collectivité
          await trx
            .insert(utilisateurCollectiviteAccessTable)
            .values({
              userId: invitedUser.id,
              collectiviteId: invitation.collectiviteId,
              isActive: true,
              role: invitation.role,
              invitationId: null,
            })
            .onConflictDoUpdate({
              target: [
                utilisateurCollectiviteAccessTable.userId,
                utilisateurCollectiviteAccessTable.collectiviteId,
              ],
              set: {
                isActive: true,
                role: invitation.role,
                modifiedAt: new Date().toISOString(),
              },
            });

          await this.roleUpdateService.setIsVerified(invitedUser.id, true, trx);

          // Relie les tags donnés
          if (invitation.tagIds && invitation.tagIds.length > 0) {
            await this.personneTagService.convertTagsToUser(
              invitedUser.id,
              invitation.tagIds,
              invitation.collectiviteId,
              user,
              trx
            );
          }
          return null;
        });
      }
    } else {
      return await this.databaseService.db.transaction(async (trx) => {
        // Vérifie si les tags demandés ne sont pas déjà utilisés par d'autres invitations en attente
        if (invitation.tagIds && invitation.tagIds.length > 0) {
          const existingInvitationTags = await trx
            .select({
              tagId: invitationPersonneTagTable.tagId,
              tagNom: invitationPersonneTagTable.tagNom,
            })
            .from(invitationPersonneTagTable)
            .innerJoin(
              invitationTable,
              eq(invitationTable.id, invitationPersonneTagTable.invitationId)
            )
            .where(
              and(
                inArray(invitationPersonneTagTable.tagId, invitation.tagIds),
                eq(invitationTable.collectiviteId, invitation.collectiviteId),
                eq(invitationTable.pending, true),
                eq(invitationTable.active, true)
              )
            );

          if (existingInvitationTags.length > 0) {
            const conflictingTags = existingInvitationTags
              .map((tag) => tag.tagNom)
              .join(', ');
            throw new Error(
              `Les tags suivants sont déjà utilisés par d'autres invitations en attente : ${conflictingTags}`
            );
          }
        }

        // Si l'utilisateur n'existe pas, on crée l'invitation
        const [invitationAdded] = await trx
          .insert(invitationTable)
          .values({
            role: invitation.role,
            email: invitation.email,
            collectiviteId: invitation.collectiviteId,
            createdBy: user.id,
          })
          .returning({
            id: invitationTable.id,
            acceptanceToken: invitationTable.acceptanceToken,
          });

        this.logger.log(
          `Crée l'invitation ${invitationAdded.id} pour l'email ${invitation.email}`
        );

        // On associe les tags à l'invitation s'ils existent
        if (invitation.tagIds && invitation.tagIds.length > 0) {
          const tagsToAdd = await trx
            .select()
            .from(personneTagTable)
            .where(inArray(personneTagTable.id, invitation.tagIds));

          await trx.insert(invitationPersonneTagTable).values(
            tagsToAdd.map((tag) => ({
              tagId: tag.id,
              invitationId: invitationAdded.id,
              tagNom: tag.nom,
            }))
          );
        }
        return invitationAdded;
      });
    }
  }

  /**
   * Retourne l'email du destinataire d'une invitation à partir du jeton secret du lien.
   * Utilisé par la page d'atterrissage pour préremplir signup/login sans
   * exposer l'adresse dans l'URL du lien d'invitation.
   */
  async getInvitationEmail(
    acceptanceToken: string
  ): Promise<{ email: string } | null> {
    const [invitation] = await this.databaseService.db
      .select({ email: invitationTable.email })
      .from(invitationTable)
      .where(eq(invitationTable.acceptanceToken, acceptanceToken))
      .limit(1);

    return invitation ?? null;
  }

  async consumeInvitation(acceptanceToken: string, user: AuthenticatedUser) {
    const [invitation] = await this.databaseService.db
      .select({
        id: invitationTable.id,
        collectiviteId: invitationTable.collectiviteId,
        role: invitationTable.role,
        active: invitationTable.active,
        consumed: invitationTable.consumed,
      })
      .from(invitationTable)
      .where(eq(invitationTable.acceptanceToken, acceptanceToken))
      .limit(1);

    if (!invitation) {
      throw new NotFoundException("L'invitation n'existe pas");
    }

    // L'email de l'invitation ne conditionne PAS la consommation : depuis la
    // connexion par fournisseur d'identité, l'email de la session est asserté
    // par le fournisseur et n'a aucune raison d'égaler celui saisi par l'admin
    // (alias, domaine différent, coquille). Le lien opaque à usage unique fait
    // seul preuve — la révocation reste donc le seul garde-fou opposable.
    if (invitation.active === false) {
      this.logger.warn(
        `L'invitation ${invitation.id} est révoquée, consommation refusée pour l'utilisateur ${user.id}`
      );
      throw new ForbiddenException(
        `L'invitation ${invitation.id} a été révoquée`
      );
    }

    // Vérifie que l'invitation n'est pas déjà consommée
    if (invitation.consumed) {
      // Permet d'être robuste à un droit qui aurait été mal crééé
      this.logger.warn(
        `L'invitation ${invitation.id} a déjà été consommée, vérification que le droit n'existe pas déjà associé`
      );

      const permissions = await this.databaseService.db
        .select()
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              invitation.collectiviteId
            ),
            eq(utilisateurCollectiviteAccessTable.invitationId, invitation.id)
          )
        )
        .limit(1);
      if (permissions.length) {
        this.logger.log(
          `Invitation ${invitation.id} déjà utilisée pour la collectivité ${invitation.collectiviteId} par l'utilisateur ${permissions[0].userId} (id de permission ${permissions[0].id})`
        );
        return;
      } else {
        this.logger.warn(
          `Invitation ${invitation.id} consommée mais permission non trouvée pour la collectivité ${invitation.collectiviteId}`
        );
      }
    }

    try {
      await this.databaseService.db.transaction((trx) =>
        this.applyInvitation(invitation, user.id, trx)
      );
    } catch (error) {
      this.logger.error(error);
      this.logger.error(
        `Erreur lors de la gestion de l'invitation: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * Seul chemin qui écrit le droit d'une invitation, qu'elle soit consommée
   * par son lien ou reprise par l'email du compte : les contrôles (révocation,
   * consommation antérieure) restent à l'appelant.
   */
  async applyInvitation(
    invitation: Pick<
      typeof invitationTable.$inferSelect,
      'id' | 'collectiviteId' | 'role'
    >,
    userId: string,
    trx: Transaction
  ): Promise<void> {
    await trx
      .update(invitationTable)
      .set({ acceptedAt: new Date().toISOString() })
      .where(eq(invitationTable.id, invitation.id));

    await this.roleUpdateService.setIsVerified(userId, true, trx);

    await trx
      .insert(utilisateurCollectiviteAccessTable)
      .values({
        userId,
        collectiviteId: invitation.collectiviteId,
        isActive: true,
        role: invitation.role,
        invitationId: invitation.id,
      })
      .onConflictDoUpdate({
        target: [
          utilisateurCollectiviteAccessTable.userId,
          utilisateurCollectiviteAccessTable.collectiviteId,
        ],
        set: {
          isActive: sql.raw(
            `excluded.${utilisateurCollectiviteAccessTable.isActive.name}`
          ),
          role: sql.raw(
            `excluded.${utilisateurCollectiviteAccessTable.role.name}`
          ),
          invitationId: sql.raw(
            `excluded.${utilisateurCollectiviteAccessTable.invitationId.name}`
          ),
        },
      });

    // Associe l'utilisateur aux tags de l'invitation et supprime les tags
    const invitationTags = await trx
      .select()
      .from(invitationPersonneTagTable)
      .where(eq(invitationPersonneTagTable.invitationId, invitation.id));

    for (const invitationTag of invitationTags) {
      // Id, nom et collectivité : le tag a pu être supprimé depuis
      // l'invitation et son id réattribué à un autre.
      const [tag] = await trx
        .select()
        .from(personneTagTable)
        .where(
          and(
            eq(personneTagTable.id, invitationTag.tagId),
            eq(personneTagTable.nom, invitationTag.tagNom),
            eq(personneTagTable.collectiviteId, invitation.collectiviteId)
          )
        )
        .limit(1);
      if (tag) {
        await this.personneTagService.changeTagAndDelete(
          trx,
          tag.id,
          userId,
          userId
        );
      }
    }
  }

  /**
   * Supprime une invitation en cours (pending) pour un email et une collectivité donnés.
   *
   * @param email - L'email de l'invitation à supprimer
   * @param collectiviteId - L'ID de la collectivité
   * @returns true si l'invitation a été supprimée, false si aucune invitation correspondante n'a été trouvée
   */
  async deletePendingInvitation(
    email: string,
    collectiviteId: number
  ): Promise<boolean> {
    // Vérifie si une invitation en cours existe pour cet email et cette collectivité
    const [invitation] = await this.databaseService.db
      .select()
      .from(invitationTable)
      .where(
        and(
          eq(invitationTable.email, email),
          eq(invitationTable.collectiviteId, collectiviteId),
          eq(invitationTable.pending, true)
        )
      )
      .limit(1);

    if (!invitation) {
      this.logger.log(
        `Aucune invitation en cours trouvée pour l'email ${email} et la collectivité ${collectiviteId}`
      );
      return false;
    }

    // Désactive l'invitation (équivalent à active = false dans la fonction PostgreSQL)
    await this.databaseService.db
      .update(invitationTable)
      .set({ active: false })
      .where(
        and(
          eq(invitationTable.email, email),
          eq(invitationTable.collectiviteId, collectiviteId)
        )
      );

    this.logger.log(
      `Invitation supprimée pour l'email ${email} et la collectivité ${collectiviteId}`
    );

    return true;
  }
}
