import { Injectable, Logger } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/pg-core';
import z from 'zod';
import DatabaseService from '../../common/services/database.service';
import { dcpTable } from '../../auth/models/dcp.table';
import { membreTable, insertMembreSchema } from '../models/membre.table';
import { utilisateurDroitTable } from '../../auth/models/private-utilisateur-droit.table';
import { invitationTable } from '../../auth/models/invitation.table';

@Injectable()
export class CollectiviteMembresService {
  private readonly logger = new Logger(CollectiviteMembresService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  readonly listInputSchema = z.object({ collectiviteId: z.number() });

  /** Liste les membres de la collectivité */
  async list({ collectiviteId }: z.infer<typeof this.listInputSchema>) {
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
          eq(utilisateurDroitTable.active, true)
        )
      );

    // sous-requête pour les invitations
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
    const rows = await unionAll(membres, invitations)
      // tri pour avoir les invitations en début de liste
      .orderBy(sql`invitation_id`);

    this.logger.log(`${rows.length} membre(s) trouvé(s)`);
    return rows;
  }

  readonly updateInputSchema = insertMembreSchema.pick({
    collectiviteId: true,
    userId: true,
    fonction: true,
    detailsFonction: true,
  });

  // met à jour un membre
  async update(membre: z.infer<typeof this.updateInputSchema>) {
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
  }
}
