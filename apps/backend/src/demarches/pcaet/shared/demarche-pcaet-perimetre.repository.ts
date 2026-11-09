import { Injectable } from '@nestjs/common';
import { collectiviteRelationsTable } from '@tet/backend/collectivites/shared/models/collectivite-relations.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarchePcaetCollectiviteCouverteTable } from '@tet/backend/demarches/shared/models/demarche-pcaet-collectivite-couverte.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  collectiviteNature,
  type CollectiviteNatureType,
} from '@tet/domain/collectivites';
import {
  DEMARCHE_PCAET_ABOUTIES_STATUSES,
  DemarcheTypeEnum,
  estNaturePorteusePcaet,
  type CollectiviteCouverte,
  type EpciCandidat,
} from '@tet/domain/demarches';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

const NATURES_EPCI_FP = collectiviteNature.filter(estNaturePorteusePcaet);

/**
 * Le périmètre du PCAET d'un Supra : les EPCI à fiscalité propre qu'il couvre.
 */
@Injectable()
export class DemarchePcaetPerimetreRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getNatureInsee(
    collectiviteId: number,
    tx?: Transaction
  ): Promise<CollectiviteNatureType | null> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ natureInsee: collectiviteTable.natureInsee })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);
    return row?.natureInsee ?? null;
  }

  /**
   * Les EPCI à fiscalité propre membres du Supra d'après les relations BANATIC
   * (`collectivite_relations`), avec la dernière démarche PCAET de chacun.
   */
  async listEpciCandidats(
    porteurId: number,
    tx?: Transaction
  ): Promise<EpciCandidat[]> {
    const db = tx ?? this.databaseService.db;

    const epcis = await db
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
        departementCode: collectiviteTable.departementCode,
      })
      .from(collectiviteRelationsTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, collectiviteRelationsTable.id)
      )
      .where(
        and(
          eq(collectiviteRelationsTable.parentId, porteurId),
          inArray(collectiviteTable.natureInsee, NATURES_EPCI_FP)
        )
      )
      .orderBy(asc(collectiviteTable.nom));

    if (epcis.length === 0) {
      return [];
    }

    const dernieres = await db
      .selectDistinctOn([demarcheTable.collectiviteId], {
        collectiviteId: demarcheTable.collectiviteId,
        status: demarcheTable.status,
        dateDebut: sql<string>`coalesce(${demarcheTable.launchedAt}, ${demarcheTable.createdAt})`,
      })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          inArray(
            demarcheTable.collectiviteId,
            epcis.map((epci) => epci.id)
          )
        )
      )
      .orderBy(demarcheTable.collectiviteId, desc(demarcheTable.createdAt));

    const derniereParEpci = new Map(
      dernieres.map(({ collectiviteId, ...derniere }) => [
        collectiviteId,
        derniere,
      ])
    );

    return epcis.map((epci) => ({
      ...epci,
      derniereDemarche: derniereParEpci.get(epci.id) ?? null,
    }));
  }

  /**
   * Le périmètre du dernier dépôt mené à son terme par le porteur : c'est lui
   * qu'un renouvellement reprend. Vide si le porteur n'a jamais abouti, ou si
   * son dernier dépôt abouti ne couvrait aucun EPCI.
   */
  async getPerimetrePrecedent(
    porteurId: number,
    tx?: Transaction
  ): Promise<number[]> {
    const db = tx ?? this.databaseService.db;

    const [precedent] = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.collectiviteId, porteurId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          inArray(demarcheTable.status, [...DEMARCHE_PCAET_ABOUTIES_STATUSES])
        )
      )
      .orderBy(desc(demarcheTable.createdAt))
      .limit(1);

    if (!precedent) {
      return [];
    }

    const rows = await db
      .select({
        collectiviteId: demarchePcaetCollectiviteCouverteTable.collectiviteId,
      })
      .from(demarchePcaetCollectiviteCouverteTable)
      .where(
        eq(demarchePcaetCollectiviteCouverteTable.demarcheId, precedent.id)
      );
    return rows.map((row) => row.collectiviteId);
  }

  async insertCollectivitesCouvertes(
    {
      demarcheId,
      collectiviteIds,
      userId,
    }: { demarcheId: number; collectiviteIds: number[]; userId: string },
    tx: Transaction
  ): Promise<void> {
    if (collectiviteIds.length === 0) {
      return;
    }
    await tx.insert(demarchePcaetCollectiviteCouverteTable).values(
      collectiviteIds.map((collectiviteId) => ({
        demarcheId,
        collectiviteId,
        createdBy: userId,
      }))
    );
  }

  async listCollectivitesCouvertes(
    demarcheIds: number[],
    tx?: Transaction
  ): Promise<Map<number, CollectiviteCouverte[]>> {
    const parDemarche = new Map<number, CollectiviteCouverte[]>();
    if (demarcheIds.length === 0) {
      return parDemarche;
    }
    const db = tx ?? this.databaseService.db;

    const rows = await db
      .select({
        demarcheId: demarchePcaetCollectiviteCouverteTable.demarcheId,
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
      })
      .from(demarchePcaetCollectiviteCouverteTable)
      .innerJoin(
        collectiviteTable,
        eq(
          collectiviteTable.id,
          demarchePcaetCollectiviteCouverteTable.collectiviteId
        )
      )
      .where(
        inArray(demarchePcaetCollectiviteCouverteTable.demarcheId, demarcheIds)
      )
      .orderBy(asc(collectiviteTable.nom));

    for (const { demarcheId, ...collectivite } of rows) {
      const couvertes = parDemarche.get(demarcheId) ?? [];
      couvertes.push(collectivite);
      parDemarche.set(demarcheId, couvertes);
    }
    return parDemarche;
  }
}
