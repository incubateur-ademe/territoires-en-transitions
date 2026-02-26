import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Membre } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { and, eq, sql } from 'drizzle-orm';
import { membreTable } from '../membre.table';
import { ListMembresInput } from './list-membres.input';

@Injectable()
export class ListMembresService {
  private readonly logger = new Logger(ListMembresService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /** Liste les membres de la collectivité */
  async list(
    { collectiviteId, estReferent, fonction }: ListMembresInput,
    { user, tx }: { user?: AuthenticatedUser; tx?: Transaction }
  ): Promise<{ membres: Membre[] }> {
    if (user) {
      await this.permissionService.isAllowed(
        user,
        'collectivites.membres.read',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    // sous-requête pour les membres déjà rattachés
    const membres = await (tx ?? this.databaseService.db)
      .select({
        userId: utilisateurCollectiviteAccessTable.userId,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        email: dcpTable.email,
        telephone: dcpTable.telephone,
        role: utilisateurCollectiviteAccessTable.role,
        fonction: membreTable.fonction,
        detailsFonction: membreTable.detailsFonction,
        champIntervention: membreTable.champIntervention,
        estReferent: membreTable.estReferent,
        createdAt: utilisateurCollectiviteAccessTable.createdAt,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        dcpTable,
        eq(dcpTable.id, utilisateurCollectiviteAccessTable.userId)
      )
      .leftJoin(
        membreTable,
        and(
          eq(membreTable.userId, utilisateurCollectiviteAccessTable.userId),
          eq(
            membreTable.collectiviteId,
            utilisateurCollectiviteAccessTable.collectiviteId
          )
        )
      )
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          fonction !== undefined
            ? eq(membreTable.fonction, fonction)
            : undefined,
          estReferent !== undefined
            ? eq(membreTable.estReferent, estReferent)
            : undefined
        )
      ).orderBy(sql`
        ${dcpTable.prenom} collate numeric_with_case_and_accent_insensitive,
        ${dcpTable.nom} collate numeric_with_case_and_accent_insensitive`);

    this.logger.log(
      `ListMembresService - collectivité ${collectiviteId} / fonction ${fonction} / estReferent ${estReferent} : ${membres.length} membres trouvés`
    );

    return { membres };
  }

  /**
   * Check if the user is an active member of the collectivite
   * @param userId user to check
   * @param collectiviteId collectivite to check
   * @param tx
   */
  async isActiveMember({
    userId,
    collectiviteId,
    tx,
  }: {
    userId: string;
    collectiviteId: number;
    tx?: Transaction;
  }): Promise<boolean> {
    const [utilisateur] = await (tx ?? this.databaseService.db)
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    return !!utilisateur;
  }
}
