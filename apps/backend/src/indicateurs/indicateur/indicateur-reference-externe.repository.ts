import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { indicateurDefinitionTable } from './indicateur-definition.table';
import { indicateurReferenceExterneTable } from './indicateur-reference-externe.table';

@Injectable()
export class IndicateurReferenceExterneRepository {
  constructor(private readonly database: DatabaseService) {}

  list(sources: string[], tx?: Transaction) {
    return (tx ?? this.database.db)
      .select({
        source: indicateurReferenceExterneTable.source,
        codeExterne: indicateurReferenceExterneTable.codeExterne,
        lienSource: indicateurReferenceExterneTable.lienSource,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        unite: indicateurDefinitionTable.unite,
        periodicite: indicateurDefinitionTable.periodicite,
        version: indicateurReferenceExterneTable.version,
      })
      .from(indicateurReferenceExterneTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(
          indicateurDefinitionTable.id,
          indicateurReferenceExterneTable.indicateurId
        )
      )
      .where(
        and(
          inArray(indicateurReferenceExterneTable.source, sources),
          isNull(indicateurDefinitionTable.collectiviteId),
          isNull(indicateurDefinitionTable.groupementId)
        )
      );
  }

  /** Les lignes en attente appartiennent à l'onglet publié ; les autres définitions restent intactes. */
  async replace(
    indicateurIds: number[],
    references: (typeof indicateurReferenceExterneTable.$inferInsert)[],
    tx: Transaction
  ) {
    await tx
      .delete(indicateurReferenceExterneTable)
      .where(
        or(
          inArray(indicateurReferenceExterneTable.indicateurId, indicateurIds),
          isNull(indicateurReferenceExterneTable.indicateurId)
        )
      );
    if (references.length) {
      await tx.insert(indicateurReferenceExterneTable).values(references);
    }
  }
}

export type PublishedIndicateurReference = Awaited<
  ReturnType<IndicateurReferenceExterneRepository['list']>
>[number];
