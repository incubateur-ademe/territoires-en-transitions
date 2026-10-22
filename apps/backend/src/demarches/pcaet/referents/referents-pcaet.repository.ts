import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteType } from '@tet/domain/collectivites';
import {
  PcaetReferent,
  typesOrganismeReferentPcaet,
} from '@tet/domain/demarches';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { pcaetReferentTable } from '../shared/models/pcaet-referent.table';

export type OrganismeReferentPcaet = {
  id: number;
  nom: string;
  type: CollectiviteType;
  departementCode: string | null;
};

export type NouveauReferentPcaet =
  | { userId: string }
  | { libelle: string; email: string };

@Injectable()
export class ReferentsPcaetRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCollectivite(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<{ type: CollectiviteType; siren: string | null } | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ type: collectiviteTable.type, siren: collectiviteTable.siren })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);
    return rows[0] ?? null;
  }

  async isMembreActif(
    userId: string,
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ userId: utilisateurCollectiviteAccessTable.userId })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async listRegions(
    tx?: Transaction
  ): Promise<{ code: string; libelle: string }[]> {
    return (tx ?? this.databaseService.db)
      .select({ code: regionTable.code, libelle: regionTable.libelle })
      .from(regionTable)
      .orderBy(asc(regionTable.libelle));
  }

  /** La DREAL, le conseil régional et les DDT d'une région. */
  async listOrganismesDeLaRegion(
    regionCode: string,
    tx?: Transaction
  ): Promise<OrganismeReferentPcaet[]> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
        departementCode: collectiviteTable.departementCode,
      })
      .from(collectiviteTable)
      .where(
        and(
          inArray(collectiviteTable.type, typesOrganismeReferentPcaet),
          eq(collectiviteTable.regionCode, regionCode)
        )
      )
      .orderBy(
        asc(collectiviteTable.departementCode),
        asc(collectiviteTable.nom)
      );

    const rang = (type: CollectiviteType) =>
      typesOrganismeReferentPcaet.indexOf(type);
    return rows.sort((a, b) => rang(a.type) - rang(b.type));
  }

  async getOrganisme(
    organismeId: number,
    tx?: Transaction
  ): Promise<OrganismeReferentPcaet | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
        departementCode: collectiviteTable.departementCode,
      })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, organismeId))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Un membre n'est référent que tant qu'il appartient à l'organisme : son
   * départ le retire de l'affichage sans qu'on ait à supprimer la ligne.
   */
  async listReferents(
    organismeIds: number[],
    tx?: Transaction
  ): Promise<PcaetReferent[]> {
    if (organismeIds.length === 0) {
      return [];
    }

    const rows = await (tx ?? this.databaseService.db)
      .select({
        id: pcaetReferentTable.id,
        organismeId: pcaetReferentTable.organismeCollectiviteId,
        userId: pcaetReferentTable.userId,
        libelle: pcaetReferentTable.libelle,
        email: pcaetReferentTable.email,
        membrePrenom: dcpTable.prenom,
        membreNom: dcpTable.nom,
        membreEmail: dcpTable.email,
        membreDeleted: dcpTable.deleted,
        membreActif: utilisateurCollectiviteAccessTable.isActive,
      })
      .from(pcaetReferentTable)
      .leftJoin(dcpTable, eq(dcpTable.id, pcaetReferentTable.userId))
      .leftJoin(
        utilisateurCollectiviteAccessTable,
        and(
          eq(
            utilisateurCollectiviteAccessTable.userId,
            pcaetReferentTable.userId
          ),
          eq(
            utilisateurCollectiviteAccessTable.collectiviteId,
            pcaetReferentTable.organismeCollectiviteId
          )
        )
      )
      .where(inArray(pcaetReferentTable.organismeCollectiviteId, organismeIds))
      .orderBy(asc(pcaetReferentTable.createdAt), asc(pcaetReferentTable.id));

    return rows.flatMap((row): PcaetReferent[] => {
      if (row.userId === null) {
        return row.libelle && row.email
          ? [
              {
                id: row.id,
                organismeId: row.organismeId,
                userId: null,
                nom: row.libelle,
                email: row.email,
              },
            ]
          : [];
      }
      if (!row.membreActif || row.membreDeleted !== false || !row.membreEmail) {
        return [];
      }
      return [
        {
          id: row.id,
          organismeId: row.organismeId,
          userId: row.userId,
          nom: `${row.membrePrenom ?? ''} ${row.membreNom ?? ''}`.trim(),
          email: row.membreEmail,
        },
      ];
    });
  }

  /** Idempotent : un référent déjà désigné ne se duplique pas. */
  async insert(
    organismeId: number,
    referent: NouveauReferentPcaet,
    createdBy: string,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(pcaetReferentTable)
      .values({
        organismeCollectiviteId: organismeId,
        createdBy,
        ...('userId' in referent
          ? { userId: referent.userId }
          : { libelle: referent.libelle, email: referent.email }),
      })
      .onConflictDoNothing();
  }

  async delete(referentId: number, tx?: Transaction): Promise<boolean> {
    const rows = await (tx ?? this.databaseService.db)
      .delete(pcaetReferentTable)
      .where(eq(pcaetReferentTable.id, referentId))
      .returning({ id: pcaetReferentTable.id });
    return rows.length > 0;
  }
}
