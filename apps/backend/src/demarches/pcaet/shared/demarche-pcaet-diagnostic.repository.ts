import { Injectable } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type {
  DemarchePcaetDiagnosticJalon,
  DemarchePcaetDiagnosticPayload,
  DemarchePcaetTopicKind,
} from '@tet/domain/demarches';
import { and, asc, desc, eq } from 'drizzle-orm';
import { demarchePcaetDiagnosticSnapshotTable } from './models/demarche-pcaet-diagnostic-snapshot.table';
import { demarchePcaetDiagnosticStateTable } from './models/demarche-pcaet-diagnostic-state.table';
import { demarchePcaetTopicRowTable } from './models/demarche-pcaet-topic-row.table';
import { demarchePcaetTopicTable } from './models/demarche-pcaet-topic.table';

/**
 * Ligne à plat de la jointure topic × ligne × définition d'indicateur. Le
 * préfixe `topic` porte les noms des deux niveaux, sans préfixe la ligne
 * elle-même.
 */
export type DiagnosticStructureRow = {
  topicId: number;
  code: string;
  label: string;
  icon: string;
  kind: DemarchePcaetTopicKind;
  topicGroupLabel: string | null;
  topicRowLabel: string | null;
  unit: string | null;
  topicReferentielId: string | null;
  horizons: number[];
  rowId: number | null;
  parentId: number | null;
  rowLabel: string | null;
  rowReferentielId: string | null;
  requis: boolean | null;
  indicateurId: number | null;
};

/** Années d'un topic pour une démarche donnée. */
export type DiagnosticTopicYears = {
  referenceYear: number;
  extraYears: number[];
};

export type DiagnosticSnapshotRow = {
  date: string;
  payload: DemarchePcaetDiagnosticPayload;
};

@Injectable()
export class DemarchePcaetDiagnosticRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Référentiel du diagnostic, déjà ordonné. Les définitions sont résolues par
   * identifiant référentiel : à la granularité du décret, aucune ligne ne
   * dépend d'un groupement d'indicateurs.
   */
  async listStructure(tx?: Transaction): Promise<DiagnosticStructureRow[]> {
    const db = tx ?? this.databaseService.db;
    return db
      .select({
        topicId: demarchePcaetTopicTable.id,
        code: demarchePcaetTopicTable.code,
        label: demarchePcaetTopicTable.label,
        icon: demarchePcaetTopicTable.icon,
        kind: demarchePcaetTopicTable.kind,
        topicGroupLabel: demarchePcaetTopicTable.groupLabel,
        topicRowLabel: demarchePcaetTopicTable.rowLabel,
        unit: demarchePcaetTopicTable.unit,
        topicReferentielId: demarchePcaetTopicTable.referentielId,
        horizons: demarchePcaetTopicTable.horizons,
        rowId: demarchePcaetTopicRowTable.id,
        parentId: demarchePcaetTopicRowTable.parentId,
        rowLabel: demarchePcaetTopicRowTable.label,
        rowReferentielId: demarchePcaetTopicRowTable.referentielId,
        requis: demarchePcaetTopicRowTable.requis,
        indicateurId: indicateurDefinitionTable.id,
      })
      .from(demarchePcaetTopicTable)
      .leftJoin(
        demarchePcaetTopicRowTable,
        eq(demarchePcaetTopicRowTable.topicId, demarchePcaetTopicTable.id)
      )
      .leftJoin(
        indicateurDefinitionTable,
        eq(
          indicateurDefinitionTable.identifiantReferentiel,
          demarchePcaetTopicRowTable.referentielId
        )
      )
      .orderBy(
        asc(demarchePcaetTopicTable.displayOrder),
        asc(demarchePcaetTopicRowTable.parentId),
        asc(demarchePcaetTopicRowTable.displayOrder)
      );
  }

  /** Années retenues par la collectivité, par identifiant de topic. */
  async listTopicYears(
    demarcheId: number,
    tx?: Transaction
  ): Promise<Map<number, DiagnosticTopicYears>> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({
        topicId: demarchePcaetDiagnosticStateTable.topicId,
        referenceYear: demarchePcaetDiagnosticStateTable.referenceYear,
        extraYears: demarchePcaetDiagnosticStateTable.extraYears,
      })
      .from(demarchePcaetDiagnosticStateTable)
      .where(eq(demarchePcaetDiagnosticStateTable.demarcheId, demarcheId));

    return new Map(
      rows.map(({ topicId, referenceYear, extraYears }) => [
        topicId,
        { referenceYear, extraYears },
      ])
    );
  }

  async upsertTopicYears(
    {
      demarcheId,
      topicId,
      referenceYear,
      extraYears,
      userId,
    }: {
      demarcheId: number;
      topicId: number;
      referenceYear: number;
      extraYears: number[];
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .insert(demarchePcaetDiagnosticStateTable)
      .values({
        demarcheId,
        topicId,
        referenceYear,
        extraYears,
        createdBy: userId,
        modifiedBy: userId,
      })
      .onConflictDoUpdate({
        target: [
          demarchePcaetDiagnosticStateTable.demarcheId,
          demarchePcaetDiagnosticStateTable.topicId,
        ],
        set: {
          referenceYear,
          extraYears,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        },
      });
  }

  async findTopicByCode(
    code: string,
    tx?: Transaction
  ): Promise<
    { id: number; kind: DemarchePcaetTopicKind; horizons: number[] } | undefined
  > {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({
        id: demarchePcaetTopicTable.id,
        kind: demarchePcaetTopicTable.kind,
        horizons: demarchePcaetTopicTable.horizons,
      })
      .from(demarchePcaetTopicTable)
      .where(eq(demarchePcaetTopicTable.code, code))
      .limit(1);
    return rows[0];
  }

  /** Photo la plus récente d'un jalon, si elle existe. */
  async findLatestSnapshot(
    {
      demarcheId,
      jalon,
    }: { demarcheId: number; jalon: DemarchePcaetDiagnosticJalon },
    tx?: Transaction
  ): Promise<DiagnosticSnapshotRow | undefined> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({
        date: sqlToDateTimeISO(demarchePcaetDiagnosticSnapshotTable.date),
        payload: demarchePcaetDiagnosticSnapshotTable.payload,
      })
      .from(demarchePcaetDiagnosticSnapshotTable)
      .where(
        and(
          eq(demarchePcaetDiagnosticSnapshotTable.demarcheId, demarcheId),
          eq(demarchePcaetDiagnosticSnapshotTable.jalon, jalon)
        )
      )
      .orderBy(desc(demarchePcaetDiagnosticSnapshotTable.date))
      .limit(1);
    return rows[0];
  }

  async insertSnapshot(
    {
      demarcheId,
      jalon,
      payload,
      userId,
    }: {
      demarcheId: number;
      jalon: DemarchePcaetDiagnosticJalon;
      payload: DemarchePcaetDiagnosticPayload;
      userId: string;
    },
    tx?: Transaction
  ): Promise<void> {
    const db = tx ?? this.databaseService.db;
    await db
      .insert(demarchePcaetDiagnosticSnapshotTable)
      .values({
        demarcheId,
        jalon,
        date: new Date().toISOString(),
        payload,
        createdBy: userId,
      })
      .onConflictDoNothing();
  }
}
