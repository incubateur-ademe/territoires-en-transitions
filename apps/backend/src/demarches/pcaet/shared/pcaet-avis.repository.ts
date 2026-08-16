import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { PcaetAvisAuTitreDe, PcaetAvisSens } from '@tet/domain/demarches';
import { and, asc, eq } from 'drizzle-orm';
import { PcaetAvis, pcaetAvisSelectColumns } from './models/pcaet-avis.dto';
import { pcaetAvisTable } from './models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from './models/pcaet-demande-avis.table';

@Injectable()
export class PcaetAvisRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getInstructeurCollectiviteId(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<number | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        instructeurCollectiviteId:
          pcaetDemandeAvisTable.instructeurCollectiviteId,
      })
      .from(pcaetDemandeAvisTable)
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    return rows[0]?.instructeurCollectiviteId ?? null;
  }

  async getDeposanteCollectiviteId(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<number | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ collectiviteId: demarcheTable.collectiviteId })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    return rows[0]?.collectiviteId ?? null;
  }

  async findByTitre(
    demandeAvisId: number,
    auTitreDe: PcaetAvisAuTitreDe,
    tx?: Transaction
  ): Promise<PcaetAvis | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select(pcaetAvisSelectColumns)
      .from(pcaetAvisTable)
      .where(
        and(
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId),
          eq(pcaetAvisTable.auTitreDe, auTitreDe)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findById(
    { demandeAvisId, avisId }: { demandeAvisId: number; avisId: string },
    tx?: Transaction
  ): Promise<PcaetAvis | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select(pcaetAvisSelectColumns)
      .from(pcaetAvisTable)
      .where(
        and(
          eq(pcaetAvisTable.id, avisId),
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listByDemande(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<PcaetAvis[]> {
    return (tx ?? this.databaseService.db)
      .select(pcaetAvisSelectColumns)
      .from(pcaetAvisTable)
      .where(eq(pcaetAvisTable.demandeAvisId, demandeAvisId))
      .orderBy(asc(pcaetAvisTable.deposeLe), asc(pcaetAvisTable.auTitreDe));
  }

  async upsert(
    {
      demandeAvisId,
      emetteurCollectiviteId,
      auTitreDe,
      sens,
      fichierRef,
      deposePar,
    }: {
      demandeAvisId: number;
      emetteurCollectiviteId: number;
      auTitreDe: PcaetAvisAuTitreDe;
      sens: PcaetAvisSens;
      fichierRef: string | null;
      deposePar: string;
    },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId,
        auTitreDe,
        sens,
        fichierRef,
        deposePar,
      })
      .onConflictDoUpdate({
        target: [pcaetAvisTable.demandeAvisId, pcaetAvisTable.auTitreDe],
        set: { sens, fichierRef, modifieLe: new Date().toISOString() },
      });
  }

  async valider(
    { demandeAvisId, avisId }: { demandeAvisId: number; avisId: string },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .update(pcaetAvisTable)
      .set({ valideLe: new Date().toISOString() })
      .where(
        and(
          eq(pcaetAvisTable.id, avisId),
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId)
        )
      );
  }

  async marquerEnvoye(
    { demandeAvisId, avisId }: { demandeAvisId: number; avisId: string },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .update(pcaetAvisTable)
      .set({ envoyeLe: new Date().toISOString() })
      .where(
        and(
          eq(pcaetAvisTable.id, avisId),
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId)
        )
      );
  }

  async delete(
    { demandeAvisId, avisId }: { demandeAvisId: number; avisId: string },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .delete(pcaetAvisTable)
      .where(
        and(
          eq(pcaetAvisTable.id, avisId),
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId)
        )
      );
  }
}
