import { Injectable } from '@nestjs/common';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq, inArray } from 'drizzle-orm';

export type CollectiviteContact = {
  prenom: string;
  nom: string;
  email: string;
};

/**
 * À qui s'adresser dans une collectivité déposante : ses administrateurs
 * actifs.
 *
 * Partagé entre le suivi d'instruction, qui les affiche pour permettre une
 * relance, et l'envoi d'un avis, qui leur écrit.
 */
@Injectable()
export class CollectiviteContactsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listContactsParCollectivite(
    collectiviteIds: number[],
    tx?: Transaction
  ): Promise<Map<number, CollectiviteContact[]>> {
    if (collectiviteIds.length === 0) {
      return new Map();
    }

    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        dcpTable,
        eq(dcpTable.id, utilisateurCollectiviteAccessTable.userId)
      )
      .where(
        and(
          inArray(
            utilisateurCollectiviteAccessTable.collectiviteId,
            collectiviteIds
          ),
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          eq(utilisateurCollectiviteAccessTable.role, CollectiviteRole.ADMIN),
          eq(dcpTable.deleted, false)
        )
      );

    const parCollectivite = new Map<number, CollectiviteContact[]>();
    for (const { collectiviteId, ...contact } of rows) {
      const contacts = parCollectivite.get(collectiviteId) ?? [];
      contacts.push(contact);
      parCollectivite.set(collectiviteId, contacts);
    }
    return parCollectivite;
  }
}
