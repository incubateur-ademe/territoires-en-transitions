import { MembreFonction } from '@/backend/collectivites/shared/models/membre-fonction.enum';
import { referentielIdEnumSchema } from '@/backend/referentiels/models/referentiel-id.enum';
import { permissionLevelSchema } from '@/backend/users/authorizations/roles/permission-level.enum';
import { utilisateurPermissionTable } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { RoleUpdateService } from '@/backend/users/authorizations/roles/role-update.service';
import { RoleService } from '@/backend/users/authorizations/roles/role.service';
import { InvitationService } from '@/backend/users/invitations/invitation.service';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { invitationTable } from '@/backend/users/models/invitation.table';
import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { paginationNoSortSchema } from '@/backend/utils/pagination.schema';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import z from 'zod';
import { insertMembreSchema, membreTable } from '../shared/models/membre.table';
import { listMembresRequestQueryOptionsSchema } from './list-membres.request';

@Injectable()
export class CollectiviteMembresService {
  private readonly logger = new Logger(CollectiviteMembresService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly roleService: RoleService,
    private readonly roleUpdateService: RoleUpdateService,
    private readonly invitationService: InvitationService
  ) {}

  readonly listInputSchema = z.object({
    collectiviteId: z.number(),
    estReferent: z
      .boolean()
      .optional()
      .describe('Filtre la liste par le statut "référent"'),
    fonction: z
      .enum(MembreFonction)
      .optional()
      .describe('Filtre la liste par fonction'),
    inclureInvitations: z
      .boolean()
      .optional()
      .describe('Inclus aussi les invitations à rejoindre la collectivité'),
    queryOptions: listMembresRequestQueryOptionsSchema.optional(),
  });

  /** Liste les membres de la collectivité */
  async list({
    collectiviteId,
    estReferent,
    fonction,
    inclureInvitations,
    queryOptions,
  }: z.infer<typeof this.listInputSchema>) {
    this.logger.log(
      `Récupération des membres pour la collectivité ${collectiviteId}`
    );

    // sous-requête pour les membres déjà rattachés
    const membres = this.databaseService.db
      .select({
        userId: utilisateurPermissionTable.userId,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
        telephone: dcpTable.telephone,
        niveauAcces: utilisateurPermissionTable.permissionLevel,
        fonction: membreTable.fonction,
        detailsFonction: membreTable.detailsFonction,
        champIntervention: membreTable.champIntervention,
        estReferent: membreTable.estReferent,
        invitationId: sql<string>`null`.as('invitation_id'),
      })
      .from(utilisateurPermissionTable)
      .leftJoin(
        dcpTable,
        eq(dcpTable.userId, utilisateurPermissionTable.userId)
      )
      .leftJoin(
        membreTable,
        and(
          eq(membreTable.userId, utilisateurPermissionTable.userId),
          eq(
            membreTable.collectiviteId,
            utilisateurPermissionTable.collectiviteId
          )
        )
      )
      .where(
        and(
          eq(utilisateurPermissionTable.collectiviteId, collectiviteId),
          eq(utilisateurPermissionTable.isActive, true),
          fonction !== undefined
            ? eq(membreTable.fonction, fonction)
            : undefined,
          estReferent !== undefined
            ? eq(membreTable.estReferent, estReferent)
            : undefined
        )
      );

    // sous-requête pour les invitations
    let baseQuery;
    if (inclureInvitations) {
      const invitations = this.databaseService.db
        .select({
          userId: sql<string>`null`.as('user_id'),
          prenom: sql<null>`null`.as('prenom'),
          nom: sql<null>`null`.as('nom'),
          email: invitationTable.email,
          telephone: sql<null>`null`.as('telephone'),
          niveauAcces: invitationTable.permissionLevel,
          fonction: sql<null>`null`.as('fonction'),
          detailsFonction: sql<null>`null`.as('details_fonction'),
          champIntervention: sql<null>`null`.as('champ_intervention'),
          estReferent: sql<null>`null`.as('est_referent'),
          invitationId: invitationTable.id,
        })
        .from(invitationTable)
        .where(
          and(
            eq(invitationTable.collectiviteId, collectiviteId),
            eq(invitationTable.pending, true)
          )
        );

      // fusionne les deux sous-requêtes
      baseQuery = unionAll(membres, invitations)
        // tri pour avoir les invitations en début de liste
        .orderBy(sql`invitation_id`);
    } else {
      baseQuery = membres;
    }

    const allRows = await baseQuery;
    const totalCount = allRows.length;

    let rows = allRows;
    if (queryOptions?.page && queryOptions?.limit) {
      const offset = (queryOptions.page - 1) * queryOptions.limit;
      rows = allRows.slice(offset, offset + queryOptions.limit);
    }

    this.logger.log(
      `${rows.length} membre(s) trouvé(s) sur ${totalCount} au total`
    );

    return {
      data: rows,
      count: totalCount,
    };
  }

  readonly updateInputSchema = insertMembreSchema
    .pick({
      collectiviteId: true,
      userId: true,
      fonction: true,
      detailsFonction: true,
      estReferent: true,
    })
    .extend({
      champIntervention: z.array(referentielIdEnumSchema).optional(),
      niveauAcces: permissionLevelSchema.optional(),
    })
    .array();

  readonly removeInputSchema = z.object({
    collectiviteId: z.number(),
    email: z.string().email(),
  });

  readonly removeWithUserInputSchema = z.object({
    collectiviteId: z.number(),
    email: z.string().email(),
    currentUserId: z.string(),
  });

  // met à jour un ou plusieurs membres
  async update(membres: z.infer<typeof this.updateInputSchema>) {
    return Promise.all(
      membres.map(async (membre) => {
        const { collectiviteId, userId, niveauAcces, ...membreData } = membre;

        this.logger.log(
          `Met à jour le membre ${userId} de la collectivité ${collectiviteId}`
        );

        return await this.databaseService.db.transaction(async (trx) => {
          if (this.hasMembreDataToUpdate(membreData)) {
            await trx
          .update(membreTable)
              .set(membreData)
          .where(
            and(
              eq(membreTable.userId, userId),
              eq(membreTable.collectiviteId, collectiviteId)
            )
          );
          }

          if (niveauAcces) {
            await this.roleUpdateService.setPermissionLevel(
              userId,
              collectiviteId,
              niveauAcces,
              trx
            );
          }

          return { userId, collectiviteId, success: true };
        });
      })
    );
  }

  /**
   * Retire un membre de la collectivité (utilisateur existant ou invitation en attente)
   * Reproduit la logique de la fonction PostgreSQL remove_membre_from_collectivite
   * @param input - collectiviteId, email du membre à retirer, et userId du demandeur
   * @returns message de succès
   */
  async remove(
    input: z.infer<typeof this.removeWithUserInputSchema>
  ): Promise<{ message: string }> {
    const { collectiviteId, email, currentUserId } = input;

    this.logger.log(
      `Suppression du membre ${email} de la collectivité ${collectiviteId} par ${currentUserId}`
    );

    return await this.databaseService.db.transaction(async (trx) => {
      const userToRemovePermission = await this.getUserByEmailInCollectivite(
        trx,
        email,
        collectiviteId
      );

      const currentUserPermissions = await this.roleService.getPermissions({
        userId: currentUserId,
    collectiviteId,
        addCollectiviteNom: false,
      });

      const isAdmin = currentUserPermissions.some(
        (p) => p.permissionLevel === 'admin' && p.isActive
      );
      const isSelfRemoval = userToRemovePermission?.userId === currentUserId;

      if (!isAdmin && !isSelfRemoval) {
        throw new NotFoundException(
          "Vous n'avez pas les droits admin, vous ne pouvez pas retirer les droits d'accès d'un utilisateur"
        );
      }

      const membre = await this.getMemberByEmailInCollectivite(
        trx,
        email,
        collectiviteId
      );

      if (membre) {
        await trx
          .update(utilisateurPermissionTable)
          .set({
            isActive: false,
            modifiedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(utilisateurPermissionTable.userId, membre.userId),
              eq(utilisateurPermissionTable.collectiviteId, collectiviteId)
            )
          );

        await trx
          .delete(membreTable)
          .where(
            and(
              eq(membreTable.userId, membre.userId),
              eq(membreTable.collectiviteId, collectiviteId)
            )
          );

        return { message: "Les accès de l'utilisateur ont été supprimés." };
      }

      // Si pas de membre trouvé, vérifier s'il y a une invitation pending
      const invitationDeleted =
        await this.invitationService.deletePendingInvitation(
          email,
          collectiviteId
        );

      if (invitationDeleted) {
        return { message: "L'invitation a été supprimée." };
      }

      throw new NotFoundException(
        "Cet utilisateur n'est pas membre de la collectivité."
      );
    });
  }

  /**
   * Récupère les informations d'un utilisateur par son email dans une collectivité
   * @param trx Transaction de base de données
   * @param email Email de l'utilisateur
   * @param collectiviteId ID de la collectivité
   * @returns Informations de l'utilisateur ou undefined si non trouvé
   */
  private async getUserByEmailInCollectivite(
    trx: Transaction,
    email: string,
    collectiviteId: number
  ): Promise<{ permissionLevel: string; userId: string } | undefined> {
    const [userPermission] = await trx
      .select({
        permissionLevel: utilisateurPermissionTable.permissionLevel,
        userId: utilisateurPermissionTable.userId,
      })
      .from(utilisateurPermissionTable)
      .innerJoin(
        dcpTable,
        eq(dcpTable.userId, utilisateurPermissionTable.userId)
      )
      .where(
        and(
          eq(dcpTable.email, email),
          eq(utilisateurPermissionTable.collectiviteId, collectiviteId),
          eq(utilisateurPermissionTable.isActive, true)
        )
      )
      .limit(1);

    return userPermission;
  }

  /**
   * Récupère l'ID d'un membre par son email dans une collectivité
   * @param trx Transaction de base de données
   * @param email Email du membre
   * @param collectiviteId ID de la collectivité
   * @returns ID du membre ou undefined si non trouvé
   */
  private async getMemberByEmailInCollectivite(
    trx: Transaction,
    email: string,
    collectiviteId: number
  ): Promise<{ userId: string } | undefined> {
    const [membre] = await trx
      .select({
        userId: utilisateurPermissionTable.userId,
      })
      .from(utilisateurPermissionTable)
      .innerJoin(
        dcpTable,
        eq(dcpTable.userId, utilisateurPermissionTable.userId)
      )
      .where(
        and(
          eq(dcpTable.email, email),
          eq(utilisateurPermissionTable.collectiviteId, collectiviteId),
          eq(utilisateurPermissionTable.isActive, true)
        )
      )
      .limit(1);

    return membre;
  }

  private hasMembreDataToUpdate = (
    membreData: Omit<
      z.infer<typeof this.updateInputSchema>[0],
      'collectiviteId' | 'userId' | 'niveauAcces'
    >
  ) => {
    return Object.keys(membreData).length > 0;
  };
}
