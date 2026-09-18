import { Injectable } from '@nestjs/common';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteRole } from '@tet/domain/users';
import { and, asc, eq, inArray } from 'drizzle-orm';

export type CollectiviteContact = {
  /** Requis pour notifier : `notification.send_to` référence `auth.users`. */
  userId: string;
  prenom: string;
  nom: string;
  email: string;
};

/**
 * À qui s'adresser dans une collectivité : ses membres actifs, par défaut ses
 * seuls administrateurs.
 *
 * Partagé entre le suivi d'instruction, qui affiche les administrateurs de la
 * déposante pour permettre une relance, et les notifications, qui écrivent
 * selon les cas aux administrateurs ou à tous les membres d'un service saisi.
 */
@Injectable()
export class CollectiviteContactsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listContactsParCollectivite(
    collectiviteIds: number[],
    { roles = [CollectiviteRole.ADMIN] }: { roles?: CollectiviteRole[] } = {},
    tx?: Transaction
  ): Promise<Map<number, CollectiviteContact[]>> {
    if (collectiviteIds.length === 0 || roles.length === 0) {
      return new Map();
    }

    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        userId: dcpTable.id,
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
          inArray(utilisateurCollectiviteAccessTable.role, roles),
          eq(dcpTable.deleted, false)
        )
      )
      // Le premier contact tient lieu de pilote : sans ordre, il changerait
      // d'un appel à l'autre.
      .orderBy(asc(dcpTable.nom), asc(dcpTable.prenom), asc(dcpTable.email));

    const parCollectivite = new Map<number, CollectiviteContact[]>();
    for (const { collectiviteId, ...contact } of rows) {
      const contacts = parCollectivite.get(collectiviteId) ?? [];
      contacts.push(contact);
      parCollectivite.set(collectiviteId, contacts);
    }
    return parCollectivite;
  }
}
