import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { PersonneTagService } from '@/backend/collectivites/tags/personnes/personne-tag.service';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { utilisateurPermissionTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { CreateInvitationInput } from '@/backend/users/invitations/create-invitation.input';
import { invitationPersonneTagTable } from '@/backend/users/invitations/invitation-personne-tag.table';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { invitationTable } from '@/backend/users/models/invitation.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personneTagService: PersonneTagService,
    private readonly membresService: CollectiviteMembresService
  ) {}

  async createInvitation(
    invitation: CreateInvitationInput,
    user: AuthenticatedUser
  ): Promise<string | null> {
    // Vérifie si l'utilisateur invité existe déjà à partir de son adresse mail
    const [invitedUser] = await this.databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.email, invitation.email))
      .limit(1);

    if (invitedUser) {
      // Si l'utilisateur existe déjà, vérifie s'il est déjà attaché à la collectivité
      const isMember = await this.membresService.isActiveMember({
        userId: invitedUser.userId,
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
            .insert(utilisateurPermissionTable)
            .values({
              userId: invitedUser.userId,
              collectiviteId: invitation.collectiviteId,
              isActive: true,
              permissionLevel: invitation.permissionLevel,
              invitationId: null,
            })
            .onConflictDoUpdate({
              target: [
                utilisateurPermissionTable.userId,
                utilisateurPermissionTable.collectiviteId,
              ],
              set: {
                isActive: true,
                permissionLevel: invitation.permissionLevel,
                modifiedAt: new Date().toISOString(),
              },
            });

          // Relie les tags donnés
          if (invitation.tagIds && invitation.tagIds.length > 0) {
            await this.personneTagService.convertTagsToUser(
              invitedUser.userId,
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
        // Si l'utilisateur n'existe pas, on crée l'invitation
        const [invitationAdded] = await trx
          .insert(invitationTable)
          .values({
            permissionLevel: invitation.permissionLevel,
            email: invitation.email,
            collectiviteId: invitation.collectiviteId,
            createdBy: user.id,
          })
          .returning();

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
        return invitationAdded.id;
      });
    }
  }

  async consumeInvitation(invitationId: string, user: AuthenticatedUser) {
    const [invitation] = await this.databaseService.db
      .select()
      .from(invitationTable)
      .where(eq(invitationTable.id, invitationId))
      .limit(1);

    // Vérifie que l'invitation n'est pas déjà consommée
    if (invitation.consumed) {
      throw new Error(`L'invitation a déjà été consommée`);
    }

    return await this.databaseService.db.transaction(async (trx) => {
      // Consomme l'invitation
      await trx
        .update(invitationTable)
        .set({ acceptedAt: new Date().toISOString() })
        .where(eq(invitationTable.id, invitationId));

      this.logger.log(
        `Consomme l'invitation ${invitationId} par l'utilisateur ${user.id}`
      );

      // Associe l'utilisateur à la collectivité
      await trx
        .insert(utilisateurPermissionTable)
        .values({
          userId: user.id,
          collectiviteId: invitation.collectiviteId,
          isActive: true,
          permissionLevel: invitation.permissionLevel,
          invitationId: invitation.id,
        })
        .onConflictDoUpdate({
          target: [
            utilisateurPermissionTable.userId,
            utilisateurPermissionTable.collectiviteId,
          ],
          set: {
            isActive: true,
            permissionLevel: invitation.permissionLevel,
            invitationId: invitation.id,
            modifiedAt: new Date().toISOString(),
          },
        });

      // Associe l'utilisateur aux tags de l'invitation et supprime les tags
      const invitationTags = await trx
        .select()
        .from(invitationPersonneTagTable)
        .where(eq(invitationPersonneTagTable.invitationId, invitationId));

      for (const invitationTag of invitationTags) {
        // Vérifie si le tag existe
        // Vérifie à la fois l'id, le nom et la collectivité
        // au cas où que le tag ait été supprimé depuis l'invitation
        // et l'id ait été réassigné à un autre tag
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
            user.id
          );
        }
      }
    });
  }

  /**
   * Supprime une invitation en cours (pending) pour un email et une collectivité donnés.
   * Cette méthode implémente la logique extraite de la fonction PostgreSQL remove_membre_from_collectivite.
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
