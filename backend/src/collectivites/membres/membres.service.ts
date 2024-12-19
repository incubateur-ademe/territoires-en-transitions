import { dcpTable } from '@/backend/auth';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import z from 'zod';
import { invitationTable } from '../../auth/models/invitation.table';
import { utilisateurDroitTable } from '@/backend/auth/authorizations/roles/private-utilisateur-droit.table';
import DatabaseService from '../../common/services/database.service';
import { MembreFonction } from '../models/membre-fonction.enum';
import { insertMembreSchema, membreTable } from '../models/membre.table';

@Injectable()
export class CollectiviteMembresService {
  private readonly logger = new Logger(CollectiviteMembresService.name);

  constructor(private readonly databaseService: DatabaseService) {}

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
  });

  /** Liste les membres de la collectivité */
  async list({
    collectiviteId,
    estReferent,
    fonction,
    inclureInvitations,
  }: z.infer<typeof this.listInputSchema>) {
    this.logger.log(
      `Récupération des membres pour la collectivité ${collectiviteId}`
    );

    // sous-requête pour les membres déjà rattachés
    const membres = this.databaseService.db
      .select({
        userId: utilisateurDroitTable.userId,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
        telephone: dcpTable.telephone,
        niveauAcces: utilisateurDroitTable.niveauAcces,
        fonction: membreTable.fonction,
        detailsFonction: membreTable.detailsFonction,
        champIntervention: membreTable.champIntervention,
        estReferent: membreTable.estReferent,
        invitationId: sql<string>`null`.as('invitation_id'),
      })
      .from(utilisateurDroitTable)
      .leftJoin(dcpTable, eq(dcpTable.userId, utilisateurDroitTable.userId))
      .leftJoin(
        membreTable,
        and(
          eq(membreTable.userId, utilisateurDroitTable.userId),
          eq(membreTable.collectiviteId, utilisateurDroitTable.collectiviteId)
        )
      )
      .where(
        and(
          eq(utilisateurDroitTable.collectiviteId, collectiviteId),
          eq(utilisateurDroitTable.active, true),
          fonction !== undefined
            ? eq(membreTable.fonction, fonction)
            : undefined,
          estReferent !== undefined
            ? eq(membreTable.estReferent, estReferent)
            : undefined
        )
      );

    // sous-requête pour les invitations
    let rows;
    if (inclureInvitations) {
      const invitations = this.databaseService.db
        .select({
          userId: sql<string>`null`.as('user_id'),
          prenom: sql<null>`null`.as('prenom'),
          nom: sql<null>`null`.as('nom'),
          email: invitationTable.email,
          telephone: sql<null>`null`.as('telephone'),
          niveauAcces: invitationTable.niveau,
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
      rows = await unionAll(membres, invitations)
        // tri pour avoir les invitations en début de liste
        .orderBy(sql`invitation_id`);
    } else {
      rows = await membres;
    }

    this.logger.log(`${rows.length} membre(s) trouvé(s)`);
    return rows;
  }

  readonly updateInputSchema = insertMembreSchema
    .pick({
      collectiviteId: true,
      userId: true,
      fonction: true,
      detailsFonction: true,
      estReferent: true,
    })
    .array();

  // met à jour un ou plusieurs membres
  async update(membres: z.infer<typeof this.updateInputSchema>) {
    return Promise.all(
      membres.map((membre) => {
        const { collectiviteId, userId, ...other } = membre;
        this.logger.log(
          `Met à jour le membre ${userId} de la collectivité ${collectiviteId}`
        );

        return this.databaseService.db
          .update(membreTable)
          .set(other)
          .where(
            and(
              eq(membreTable.userId, userId),
              eq(membreTable.collectiviteId, collectiviteId)
            )
          );
      })
    );
  }
}
