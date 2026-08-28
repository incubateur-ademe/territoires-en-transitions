import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type {
  DemandeAvisAchevement,
  PcaetAvisAuTitreDe,
  PcaetAvisSens,
} from '@tet/domain/demarches';
import {
  getTitresAvisInstructeur,
  typesInstructeurDeposantAvis,
} from '@tet/domain/demarches';
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';
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

  /**
   * Le couple qui identifie la démarche derrière une demande d'avis — ce qu'une
   * transition attend en entrée.
   */
  async getDemarcheCible(
    demandeAvisId: number,
    tx?: Transaction
  ): Promise<{ demarcheId: number; collectiviteId: number } | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
      })
      .from(pcaetDemandeAvisTable)
      .innerJoin(
        demarcheTable,
        eq(demarcheTable.id, pcaetDemandeAvisTable.demarcheId)
      )
      .where(eq(pcaetDemandeAvisTable.id, demandeAvisId))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Les demandes d'avis d'un dossier, chacune avec les titres pour lesquels un
   * avis **validé** existe — la matière du guard `avisTousRendus`.
   *
   * Jointure à gauche : une demande sans aucun avis validé doit apparaître avec
   * une liste vide, sinon elle disparaîtrait du décompte et l'instruction
   * paraîtrait achevée.
   */
  async listAchevementDemandes(
    demarcheId: number,
    tx?: Transaction
  ): Promise<DemandeAvisAchevement[]> {
    const rows = await (tx ?? this.databaseService.db)
      .select({
        demandeAvisId: pcaetDemandeAvisTable.id,
        instructeurType: collectiviteTable.type,
        auTitreDe: pcaetAvisTable.auTitreDe,
      })
      .from(pcaetDemandeAvisTable)
      .leftJoin(
        pcaetAvisTable,
        and(
          eq(pcaetAvisTable.demandeAvisId, pcaetDemandeAvisTable.id),
          isNotNull(pcaetAvisTable.valideLe)
        )
      )
      // Seules les demandes adressées à un instructeur *saisi pour avis*
      // comptent dans l'achèvement. La région et la DDT reçoivent le dossier en
      // lecture : les compter ici bloquerait la clôture pour toujours, puisque
      // aucun avis ne peut émaner d'elles.
      .innerJoin(
        collectiviteTable,
        and(
          eq(
            collectiviteTable.id,
            pcaetDemandeAvisTable.instructeurCollectiviteId
          ),
          inArray(collectiviteTable.type, typesInstructeurDeposantAvis)
        )
      )
      .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));

    const demandes = new Map<number, DemandeAvisAchevement>();
    for (const row of rows) {
      const demande = demandes.get(row.demandeAvisId) ?? {
        // Ce que la règle attend de ce destinataire-là : la DREAL ne répond pas
        // du titre du président de région, et réciproquement.
        titresAttendus: getTitresAvisInstructeur(row.instructeurType),
        titresValides: [] as PcaetAvisAuTitreDe[],
      };
      if (row.auTitreDe) {
        (demande.titresValides as PcaetAvisAuTitreDe[]).push(row.auTitreDe);
      }
      demandes.set(row.demandeAvisId, demande);
    }

    return [...demandes.values()];
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

  /**
   * La collectivité qui a émis cet avis — celle dont le bucket porte le rapport
   * joint.
   *
   * Lu sur l'avis, et non déduit de l'instructeur de la demande : le trigger
   * `check_emetteur` impose seulement que l'émetteur soit *de type* instructeur,
   * pas qu'il soit celui de la demande.
   */
  async getEmetteurCollectiviteId(
    { demandeAvisId, avisId }: { demandeAvisId: number; avisId: string },
    tx?: Transaction
  ): Promise<number | null> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ emetteurCollectiviteId: pcaetAvisTable.emetteurCollectiviteId })
      .from(pcaetAvisTable)
      .where(
        and(
          eq(pcaetAvisTable.id, avisId),
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId)
        )
      )
      .limit(1);

    return rows[0]?.emetteurCollectiviteId ?? null;
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
