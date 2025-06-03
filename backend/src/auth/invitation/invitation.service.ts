import { PermissionOperationEnum } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { utilisateurPermissionTable } from '@/backend/auth/authorizations/roles/private-utilisateur-droit.table';
import { invitationPersonneTagTable } from '@/backend/auth/invitation/invitation-personne-tag.table';
import { InvitationRequest } from '@/backend/auth/invitation/invitation.request';
import { AuthRole, AuthUser } from '@/backend/auth/models/auth.models';
import { dcpTable } from '@/backend/auth/models/dcp.table';
import { invitationTable } from '@/backend/auth/models/invitation.table';
import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { PersonneTagService } from '@/backend/collectivites/tags/personnes/personne-tag.service';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly personneTagService: PersonneTagService,
    private readonly membresService: CollectiviteMembresService
  ) {}

  /**
   * Crée l'invitation
   * @invitation
   * @user
   */
  async createInvitation(
    invitation: InvitationRequest,
    user: AuthUser
  ): Promise<string | null> {
    // Vérifie que la personne qui invite a les droits
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['MEMBRES.EDITION'],
      ResourceType.COLLECTIVITE,
      invitation.collectiviteId
    );
    const userId: string = user.id!;
    // Vérifie si l'utilisateur invité existe déjà à partir de son adresse mail
    const [invitedUser] = await this.databaseService.db
      .select()
      .from(dcpTable)
      .where(eq(dcpTable.email, invitation.email))
      .limit(1);

    if (invitedUser) {
      // Si l'utilisateur existe déjà, vérifie s'il est déjà attaché à la collectivité
      const isMember = await this.membresService.isUserActiveMember(
        invitedUser.userId,
        invitation.collectiviteId
      );
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
              niveau: invitation.niveau,
              invitationId: null,
            })
            .onConflictDoUpdate({
              target: [
                utilisateurPermissionTable.userId,
                utilisateurPermissionTable.collectiviteId,
              ],
              set: {
                isActive: true,
                niveau: invitation.niveau,
                modifiedAt: new Date().toISOString(),
              },
            });

          // Relie les tags donnés
          if (invitation.tagIds && invitation.tagIds.length > 0) {
            await this.personneTagService.tagsToUser(
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
            niveau: invitation.niveau,
            email: invitation.email,
            collectiviteId: invitation.collectiviteId,
            createdBy: userId,
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

  /**
   * Consomme l'invitation
   * @param invitationId
   * @param user
   */
  async consumeInvitation(invitationId: string, user: AuthUser) {
    // Vérifie que l'utilisateur est connecté
    if (!(user.role === AuthRole.AUTHENTICATED && user.id)) {
      throw new Error(`Aucun utilisateur authentifié`);
    }
    const userId: string = user.id;
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
        `Consomme l'invitation ${invitationId} par l'utilisateur ${userId}`
      );

      // Associe l'utilisateur à la collectivité
      await trx
        .insert(utilisateurPermissionTable)
        .values({
          userId: userId,
          collectiviteId: invitation.collectiviteId,
          isActive: true,
          niveau: invitation.niveau,
          invitationId: invitation.id,
        })
        .onConflictDoUpdate({
          target: [
            utilisateurPermissionTable.userId,
            utilisateurPermissionTable.collectiviteId,
          ],
          set: {
            isActive: true,
            niveau: invitation.niveau,
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
          await this.personneTagService.changeTagAndDelete(trx, tag.id, userId);
        }
      }
    });
  }
}
