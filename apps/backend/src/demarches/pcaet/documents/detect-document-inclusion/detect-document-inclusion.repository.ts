import { Injectable } from '@nestjs/common';
import { demarcheDocumentDetectionTable } from '@tet/backend/demarches/shared/models/demarche-document-detection.table';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { DemarcheDocumentDetectionPartie } from '@tet/domain/demarches';
import { and, eq, isNotNull, sql } from 'drizzle-orm';

export type DetectionToRun = {
  id: number;
  demarcheId: number;
  collectiviteId: number;
  documentId: string;
  includedDocumentId: string;
  fichierId: number;
  status: 'pending' | 'done' | 'failed';
};

export type DetectionOutcome =
  | {
      status: 'done';
      isIncluded: boolean;
      parties: DemarcheDocumentDetectionPartie[];
      sectionTitle: string | null;
      pages: string[];
      justification: string;
      model: string | null;
    }
  | { status: 'failed'; justification: string; model: string | null };

/** Écritures des analyses de fichiers déposés. */
@Injectable()
export class DetectDocumentInclusionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * (Ré)ouvre une analyse par pièce cherchée, sur le fichier qui vient d'être
   * déposé : le résultat d'un fichier précédent ne vaut plus.
   */
  async resetPending(
    {
      demarcheId,
      documentId,
      fichierId,
      includedDocumentIds,
    }: {
      demarcheId: number;
      documentId: string;
      fichierId: number;
      includedDocumentIds: readonly string[];
    },
    tx?: Transaction
  ): Promise<Array<{ id: number; fichierId: number }>> {
    if (includedDocumentIds.length === 0) {
      return [];
    }
    const rows = await (tx ?? this.databaseService.db)
      .insert(demarcheDocumentDetectionTable)
      .values(
        includedDocumentIds.map((includedDocumentId) => ({
          demarcheId,
          documentId,
          includedDocumentId,
          fichierId,
          status: 'pending' as const,
        }))
      )
      .onConflictDoUpdate({
        target: [
          demarcheDocumentDetectionTable.demarcheId,
          demarcheDocumentDetectionTable.documentId,
          demarcheDocumentDetectionTable.includedDocumentId,
        ],
        set: {
          fichierId,
          status: 'pending',
          isIncluded: null,
          parties: [],
          sectionTitle: null,
          pages: [],
          justification: '',
          model: null,
          createdAt: sql`now()`,
          analyzedAt: null,
        },
      })
      .returning({
        id: demarcheDocumentDetectionTable.id,
        fichierId: demarcheDocumentDetectionTable.fichierId,
      });
    return rows;
  }

  /** Le document retiré n'a plus rien à détecter. */
  async deleteForDocument(
    { demarcheId, documentId }: { demarcheId: number; documentId: string },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .delete(demarcheDocumentDetectionTable)
      .where(
        and(
          eq(demarcheDocumentDetectionTable.demarcheId, demarcheId),
          eq(demarcheDocumentDetectionTable.documentId, documentId)
        )
      );
  }

  async findById(
    id: number,
    tx?: Transaction
  ): Promise<DetectionToRun | undefined> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        id: demarcheDocumentDetectionTable.id,
        demarcheId: demarcheDocumentDetectionTable.demarcheId,
        collectiviteId: demarcheTable.collectiviteId,
        documentId: demarcheDocumentDetectionTable.documentId,
        includedDocumentId: demarcheDocumentDetectionTable.includedDocumentId,
        fichierId: demarcheDocumentDetectionTable.fichierId,
        status: demarcheDocumentDetectionTable.status,
      })
      .from(demarcheDocumentDetectionTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, demarcheDocumentDetectionTable.demarcheId)
      )
      .where(eq(demarcheDocumentDetectionTable.id, id))
      .limit(1);
    return rows[0];
  }

  /** Le fichier déposé à l'amont pour cette pièce, `null` s'il n'y en a pas. */
  async findFichierIdAmont(
    { demarcheId, documentId }: { demarcheId: number; documentId: string },
    tx?: Transaction
  ): Promise<number | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ fichierId: demarcheDocumentTable.fichierId })
      .from(demarcheDocumentTable)
      .where(
        and(
          eq(demarcheDocumentTable.demarcheId, demarcheId),
          eq(demarcheDocumentTable.documentId, documentId),
          eq(demarcheDocumentTable.etape, 'amont'),
          isNotNull(demarcheDocumentTable.fichierId)
        )
      )
      .limit(1);
    return rows[0]?.fichierId ?? null;
  }

  /**
   * Enregistre le résultat, à condition que l'analyse porte toujours sur ce
   * fichier et soit encore attendue : un dépôt survenu entre-temps l'a remise à
   * zéro, son résultat serait celui d'un autre fichier.
   */
  async complete(
    { id, fichierId }: { id: number; fichierId: number },
    outcome: DetectionOutcome,
    tx?: Transaction
  ): Promise<boolean> {
    const rows = await (tx ?? this.databaseService.db)
      .update(demarcheDocumentDetectionTable)
      .set({
        status: outcome.status,
        isIncluded: outcome.status === 'done' ? outcome.isIncluded : null,
        parties: outcome.status === 'done' ? outcome.parties : [],
        sectionTitle: outcome.status === 'done' ? outcome.sectionTitle : null,
        pages: outcome.status === 'done' ? outcome.pages : [],
        justification: outcome.justification,
        model: outcome.model,
        analyzedAt: sql`now()`,
      })
      .where(
        and(
          eq(demarcheDocumentDetectionTable.id, id),
          eq(demarcheDocumentDetectionTable.fichierId, fichierId),
          eq(demarcheDocumentDetectionTable.status, 'pending')
        )
      )
      .returning({ id: demarcheDocumentDetectionTable.id });
    return rows.length > 0;
  }

  /**
   * Passe en échec une analyse qui n'aboutira pas, si elle porte toujours sur
   * ce fichier : un dépôt plus récent a la sienne.
   */
  async markFailed(
    { id, fichierId }: { id: number; fichierId: number },
    justification: string,
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .update(demarcheDocumentDetectionTable)
      .set({ status: 'failed', justification, analyzedAt: sql`now()` })
      .where(
        and(
          eq(demarcheDocumentDetectionTable.id, id),
          eq(demarcheDocumentDetectionTable.fichierId, fichierId),
          eq(demarcheDocumentDetectionTable.status, 'pending')
        )
      );
  }

  /**
   * Coche la case de la pièce trouvée, si sa place est libre : ni fichier
   * dédié, ni déclaration déjà là. Écrite par le système, sans auteur.
   */
  async declareInclusion(
    {
      collectiviteId,
      demarcheId,
      documentId,
    }: { collectiviteId: number; demarcheId: number; documentId: string },
    tx?: Transaction
  ): Promise<boolean> {
    const rows = await (tx ?? this.databaseService.db)
      .insert(demarcheDocumentTable)
      .values({
        collectiviteId,
        demarcheId,
        documentId,
        etape: 'amont',
        modifiedBy: null,
        modifiedAt: new Date().toISOString(),
      })
      .onConflictDoNothing({
        target: [
          demarcheDocumentTable.demarcheId,
          demarcheDocumentTable.documentId,
          demarcheDocumentTable.etape,
        ],
      })
      .returning({ id: demarcheDocumentTable.id });
    return rows.length > 0;
  }
}
