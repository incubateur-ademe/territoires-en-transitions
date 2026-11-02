import { Injectable } from '@nestjs/common';
import { membreTable } from '@tet/backend/collectivites/membres/membre.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, count, eq, sql } from 'drizzle-orm';

export type FoundUser = {
  userId: string;
  prenom: string;
  nom: string;
  compteActif: boolean;
  cguAccepteesLe: string | null;
  collectivites: {
    collectiviteId: number;
    nom: string;
    type: string;
    niveauAcces: string;
    fonction: string | null;
    estReferent: boolean;
  }[];
};

/**
 * Lectures croisées utilisateur × collectivités pour les outils MCP. Aucun
 * service existant ne lit ensemble les droits et la fonction d'un membre, et
 * la recherche par e-mail de `ListUsersService` est sensible à la casse.
 */
@Injectable()
export class FindUserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByEmail(email: string): Promise<FoundUser | null> {
    const db = this.databaseService.db;
    const [user] = await db
      .select({
        userId: dcpTable.id,
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        limited: dcpTable.limited,
        deleted: dcpTable.deleted,
        cguAccepteesLe: dcpTable.cguAccepteesLe,
      })
      .from(dcpTable)
      .where(eq(sql`lower(${dcpTable.email})`, email.trim().toLowerCase()))
      .limit(1);
    if (!user) {
      return null;
    }

    const collectivites = await db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
        niveauAcces: utilisateurCollectiviteAccessTable.role,
        fonction: membreTable.fonction,
        estReferent: membreTable.estReferent,
      })
      .from(utilisateurCollectiviteAccessTable)
      .innerJoin(
        collectiviteTable,
        eq(
          collectiviteTable.id,
          utilisateurCollectiviteAccessTable.collectiviteId
        )
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
          eq(utilisateurCollectiviteAccessTable.userId, user.userId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      );

    return {
      userId: user.userId,
      prenom: user.prenom,
      nom: user.nom,
      compteActif: !user.limited && !user.deleted,
      cguAccepteesLe: user.cguAccepteesLe ?? null,
      collectivites: collectivites.map((c) => ({
        collectiviteId: c.collectiviteId,
        nom: c.nom,
        type: c.type,
        niveauAcces: String(c.niveauAcces),
        fonction: c.fonction ?? null,
        estReferent: c.estReferent ?? false,
      })),
    };
  }

  async countActiveMembers(collectiviteId: number): Promise<number> {
    const [row] = await this.databaseService.db
      .select({ n: count() })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      );
    return row?.n ?? 0;
  }
}
