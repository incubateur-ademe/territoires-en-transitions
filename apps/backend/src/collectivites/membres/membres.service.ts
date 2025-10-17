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
import { unaccent } from '@/backend/utils/unaccent.utils';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import z from 'zod';
import { insertMembreSchema, membreTable } from '../shared/models/membre.table';

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
    queryOptions: paginationNoSortSchema.optional(),
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
      baseQuery = unionAll(membres, invitations);
    } else {
      baseQuery = membres;
    }

    const allRows = await baseQuery;

    const sortedRows = allRows.sort(this.sortMembres);

    const totalCount = sortedRows.length;

    let rows = sortedRows;
    if (queryOptions?.page && queryOptions?.limit) {
      const offset = (queryOptions.page - 1) * queryOptions.limit;
      rows = sortedRows.slice(offset, offset + queryOptions.limit);
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
    .array()
    .min(1, 'Au moins un membre doit être fourni')
    .refine(
      (membres) => {
        const firstCollectiviteId = membres[0].collectiviteId;
        return membres.every((m) => m.collectiviteId === firstCollectiviteId);
      },
      {
        message: 'Tous les membres doivent appartenir à la même collectivité.',
      }
    );

  async update(
    membres: z.infer<typeof this.updateInputSchema>,
    currentUserId: string
  ) {
    await this.checkUpdatePermissions(membres, currentUserId);

    return Promise.all(
      membres.map(async (membre) => {
        const { collectiviteId, userId, niveauAcces, ...membreData } = membre;

        this.logger.log(
          `Met à jour le membre ${userId} de la collectivité ${collectiviteId}`
        );

        return await this.databaseService.db.transaction(async (trx) => {
          if (this.hasMembreDataToUpdate(membreData)) {
            await trx
              .insert(membreTable)
              .values({
                userId,
                collectiviteId,
                ...membreData,
              })
              .onConflictDoUpdate({
                target: [membreTable.userId, membreTable.collectiviteId],
                set: membreData,
              });
          }

          if (niveauAcces !== undefined && niveauAcces !== null) {
            await this.roleUpdateService.setPermissionLevel(
              userId,
              collectiviteId,
              niveauAcces,
              trx
            );
          }
        });
      })
    );
  }

  readonly updateReferentsInputSchema = insertMembreSchema
    .pick({
      collectiviteId: true,
      userId: true,
      estReferent: true,
    })
    .array()
    .min(1, 'Au moins un membre doit être fourni')
    .refine(
      (membres) => {
        const firstCollectiviteId = membres[0].collectiviteId;
        return membres.every((m) => m.collectiviteId === firstCollectiviteId);
      },
      {
        message: 'Tous les membres doivent appartenir à la même collectivité.',
      }
    );

  async updateReferents(
    membres: z.infer<typeof this.updateReferentsInputSchema>
  ) {
    return Promise.all(
      membres.map(async (membre) => {
        const { collectiviteId, userId, estReferent } = membre;

        this.logger.log(
          `Met à jour le statut référent du membre ${userId} de la collectivité ${collectiviteId}`
        );

        return await this.databaseService.db.transaction(async (trx) => {
          await trx
            .insert(membreTable)
            .values({
              userId,
              collectiviteId,
              estReferent,
            })
            .onConflictDoUpdate({
              target: [membreTable.userId, membreTable.collectiviteId],
              set: { estReferent },
            });
        });
      })
    );
  }

  readonly removeInputSchema = z.object({
    collectiviteId: z.number(),
    email: z.string().email(),
  });

  /**
   * Retire un membre de la collectivité (utilisateur existant ou invitation en attente)
   * @param input - collectiviteId, email du membre à retirer, et userId du demandeur
   * @returns message de succès
   */
  async remove(
    input: z.infer<typeof this.removeInputSchema>,
    currentUserId: string
  ): Promise<{ message: string }> {
    const { collectiviteId, email } = input;

    this.logger.log(
      `Suppression du membre ${email} de la collectivité ${collectiviteId} par ${currentUserId}`
    );

    return await this.databaseService.db.transaction(async (trx) => {
      const [membre, pendingInvitation] = await Promise.all([
        this.getMembre(trx, email, collectiviteId),
        this.getPendingInvitation(trx, email, collectiviteId),
      ]);

      if (!membre && !pendingInvitation) {
        throw new NotFoundException(
          "Cet utilisateur n'est pas membre de la collectivité ou n'a pas d'invitation en attente."
        );
      }

      if (membre) {
        return this.removeMembre(trx, membre, collectiviteId, currentUserId);
      }

      if (pendingInvitation) {
        return this.removeInvitation(
          pendingInvitation,
          collectiviteId,
          currentUserId
        );
      }

      // Ne devrait jamais arriver ici grâce à la vérification initiale
      throw new NotFoundException(
        "Cet utilisateur n'est pas membre de la collectivité ou n'a pas d'invitation en attente."
      );
    });
  }

  /**
   * Supprime un membre de la collectivité
   * @param trx Transaction de base de données
   * @param membre Membre à supprimer
   * @param collectiviteId ID de la collectivité
   * @param currentUserId ID de l'utilisateur qui effectue la suppression
   * @returns message de succès
   */
  private async removeMembre(
    trx: Transaction,
    membre: { userId: string },
    collectiviteId: number,
    currentUserId: string
  ): Promise<{ message: string }> {
    await this.checkRemoveMembrePermissions(
      membre.userId,
      collectiviteId,
      currentUserId
    );

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

  /**
   * Supprime une invitation en attente
   * @param invitation Invitation à supprimer
   * @param collectiviteId ID de la collectivité
   * @param currentUserId ID de l'utilisateur qui effectue la suppression
   * @returns message de succès
   */
  private async removeInvitation(
    invitation: { createdBy: string; email: string },
    collectiviteId: number,
    currentUserId: string
  ): Promise<{ message: string }> {
    await this.checkRemoveInvitationPermissions(
      invitation.createdBy,
      collectiviteId,
      currentUserId
    );

    const invitationDeleted =
      await this.invitationService.deletePendingInvitation(
        invitation.email,
        collectiviteId
      );

    if (!invitationDeleted) {
      throw new NotFoundException("L'invitation n'a pas pu être supprimée.");
    }

    return { message: "L'invitation a été supprimée." };
  }

  /**
   * Vérifie si l'utilisateur est admin d'une collectivité
   * @param userId ID de l'utilisateur
   * @param collectiviteId ID de la collectivité
   * @returns true si l'utilisateur est admin, false sinon
   */
  private async isUserAdmin(
    userId: string,
    collectiviteId: number
  ): Promise<boolean> {
    const permissions = await this.roleService.getPermissions({
      userId,
      collectiviteId,
      addCollectiviteNom: false,
    });

    return permissions.some((p) => p.permissionLevel === 'admin' && p.isActive);
  }

  /**
   * Vérifie les permissions pour supprimer un membre
   * @param memberUserId ID du membre à supprimer
   * @param collectiviteId ID de la collectivité
   * @param currentUserId ID de l'utilisateur qui effectue la suppression
   */
  private async checkRemoveMembrePermissions(
    memberUserId: string,
    collectiviteId: number,
    currentUserId: string
  ): Promise<void> {
    const isAdmin = await this.isUserAdmin(currentUserId, collectiviteId);
    const isSelfRemoval = memberUserId === currentUserId;

    if (!isAdmin && !isSelfRemoval) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits admin, vous ne pouvez pas retirer les droits d'accès d'un utilisateur"
      );
    }
  }

  /**
   * Vérifie les permissions pour supprimer une invitation
   * @param invitationCreatedBy ID de l'utilisateur qui a créé l'invitation
   * @param collectiviteId ID de la collectivité
   * @param currentUserId ID de l'utilisateur qui effectue la suppression
   */
  private async checkRemoveInvitationPermissions(
    invitationCreatedBy: string,
    collectiviteId: number,
    currentUserId: string
  ): Promise<void> {
    const isAdmin = await this.isUserAdmin(currentUserId, collectiviteId);
    const isInvitationCreator = invitationCreatedBy === currentUserId;

    if (!isAdmin && !isInvitationCreator) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour supprimer cette invitation"
      );
    }
  }

  /**
   * Récupère l'ID d'un membre par son email dans une collectivité
   * @param trx Transaction de base de données
   * @param email Email du membre
   * @param collectiviteId ID de la collectivité
   * @returns ID du membre ou undefined si non trouvé
   */
  private async getMembre(
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

  /**
   * Récupère une invitation en attente par email dans une collectivité
   * @param trx Transaction de base de données
   * @param email Email de l'invitation
   * @param collectiviteId ID de la collectivité
   * @returns Invitation en attente ou undefined si non trouvée
   */
  private async getPendingInvitation(
    trx: Transaction,
    email: string,
    collectiviteId: number
  ) {
    const [invitation] = await trx
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

    return invitation;
  }

  private hasMembreDataToUpdate = (
    membreData: Omit<
      z.infer<typeof this.updateInputSchema>[0],
      'collectiviteId' | 'userId' | 'niveauAcces'
    >
  ) => {
    return Object.keys(membreData).length > 0;
  };

  private sortMembres = (
    a: {
      invitationId: string | null;
      estReferent: boolean | null;
      fonction: string | null;
      prenom: string | null;
    },
    b: {
      invitationId: string | null;
      estReferent: boolean | null;
      fonction: string | null;
      prenom: string | null;
    }
  ) => {
    // Tri par invitation_id (invitations en premier, puis membres)
    const aIsInvitation = a.invitationId !== null;
    const bIsInvitation = b.invitationId !== null;
    if (aIsInvitation !== bIsInvitation) {
      return aIsInvitation ? -1 : 1;
    }

    // Tri par estReferent (référents en premier)
    const aEstReferent = a.estReferent === true ? 1 : 0;
    const bEstReferent = b.estReferent === true ? 1 : 0;
    if (aEstReferent !== bEstReferent) {
      return bEstReferent - aEstReferent;
    }

    // Tri par fonction
    const fonctionOrder: Record<string, number> = {
      technique: 1,
      politique: 2,
      conseiller: 3,
      partenaire: 4,
    };
    const aFonctionOrder = a.fonction ? fonctionOrder[a.fonction] || 5 : 5;
    const bFonctionOrder = b.fonction ? fonctionOrder[b.fonction] || 5 : 5;
    if (aFonctionOrder !== bFonctionOrder) {
      return aFonctionOrder - bFonctionOrder;
    }

    // Tri par prenom (sans accents, en minuscules)
    const aPrenom = unaccent((a.prenom || '').toLowerCase());
    const bPrenom = unaccent((b.prenom || '').toLowerCase());
    return aPrenom.localeCompare(bPrenom);
  };

  private async checkUpdatePermissions(
    membres: z.infer<typeof this.updateInputSchema>,
    currentUserId: string
  ) {
    // Le schema garantit que tous les membres appartiennent à la même collectivité
    // (ce qui est le cas pour l'update dans l'UI actuelle)
    const collectiviteId = membres[0].collectiviteId;
    const isAdmin = await this.isUserAdmin(currentUserId, collectiviteId);

    for (const membre of membres) {
      const { userId, niveauAcces, ...membreData } = membre;
      const isSelfModification = currentUserId === userId;

      if (niveauAcces !== undefined && niveauAcces !== null && !isAdmin) {
        throw new ForbiddenException(
          "Vous n'avez pas les droits admin, vous ne pouvez pas éditer le niveau d'accès de ce membre."
        );
      }

      if (
        this.hasMembreDataToUpdate(membreData) &&
        !isAdmin &&
        !isSelfModification
      ) {
        throw new ForbiddenException(
          "Vous n'avez pas les droits pour modifier les informations de ce membre."
        );
      }
    }
  }
}
