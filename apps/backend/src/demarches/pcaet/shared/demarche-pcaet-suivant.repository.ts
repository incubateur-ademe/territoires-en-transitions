import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DEMARCHE_PCAET_ABOUTIES_STATUSES,
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import {
  and,
  eq,
  exists,
  gt,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const suivantTable = alias(demarcheTable, 'suivant');

/**
 * Un PCAET de la même collectivité a-t-il été adopté après la ligne courante
 * de `demarche` ? C'est la date de la délibération qui ordonne, pas l'ordre de
 * saisie sur la plateforme : un dépôt antidaté reste le précédent de celui
 * qu'il précède dans les faits.
 *
 * Une démarche publiée sans date d'adoption (antérieure à sa saisie) est
 * remplacée par n'importe quel PCAET daté.
 */
const existsSuivantAdopte = (db: DatabaseService['db'] | Transaction) =>
  exists(
    db
      .select({ id: suivantTable.id })
      .from(suivantTable)
      .where(
        and(
          eq(suivantTable.type, DemarcheTypeEnum.PCAET),
          eq(suivantTable.collectiviteId, demarcheTable.collectiviteId),
          ne(suivantTable.id, demarcheTable.id),
          inArray(suivantTable.status, [...DEMARCHE_PCAET_ABOUTIES_STATUSES]),
          isNotNull(suivantTable.adoptedAt),
          or(
            isNull(demarcheTable.adoptedAt),
            gt(suivantTable.adoptedAt, demarcheTable.adoptedAt)
          )
        )
      )
  );

/**
 * Succession des PCAET d'une collectivité : un PCAET publié est remplacé dès
 * que le suivant est adopté.
 */
@Injectable()
export class DemarchePcaetSuivantRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Sérialise, jusqu'à la fin de la transaction, les publications d'une même
   * collectivité. Sans lui, deux publications simultanées liraient chacune la
   * collectivité avant que l'autre ne soit validée : aucune n'archiverait
   * l'autre, et deux PCAET resteraient en vigueur.
   */
  async lockSuccession(
    { collectiviteId }: { collectiviteId: number },
    tx: Transaction
  ): Promise<void> {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('demarche_pcaet_succession'), ${collectiviteId})`
    );
  }

  async isSuivantAdopte(
    { demarcheId }: { demarcheId: number },
    tx?: Transaction
  ): Promise<boolean> {
    const db = tx ?? this.databaseService.db;
    const [row] = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(and(eq(demarcheTable.id, demarcheId), existsSuivantAdopte(db)));
    return row !== undefined;
  }

  /** Les PCAET encore publiés de la collectivité dont le suivant est adopté. */
  async listRemplaceesIds(
    { collectiviteId }: { collectiviteId: number },
    tx?: Transaction
  ): Promise<number[]> {
    const db = tx ?? this.databaseService.db;
    const rows = await db
      .select({ id: demarcheTable.id })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.status, DemarchePcaetStatusEnum.PUBLIE),
          existsSuivantAdopte(db)
        )
      );
    return rows.map((row) => row.id);
  }
}
