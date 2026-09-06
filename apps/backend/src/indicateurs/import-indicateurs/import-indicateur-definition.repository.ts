import { Injectable } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import {
  CreateIndicateurCategorieTag,
  indicateurCategorieTagTable,
} from '@tet/backend/indicateurs/definitions/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import {
  CreateIndicateurGroupe,
  indicateurGroupeTable,
} from '@tet/backend/indicateurs/shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '@tet/backend/indicateurs/shared/models/indicateur-thematique.table';
import { indicateurObjectifTable } from '@tet/backend/indicateurs/shared/models/indicateur-objectif.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CategorieTagCreate } from '@tet/domain/collectivites';
import {
  IndicateurPeriodicite,
  IndicateurThematiqueCreate,
} from '@tet/domain/indicateurs';
import { ThematiqueCreate } from '@tet/domain/shared';
import { asc, inArray } from 'drizzle-orm';

export type ImportCategorieRelation = CreateIndicateurCategorieTag;
export type ImportGroupRelation = CreateIndicateurGroupe;
export type ImportThematiqueRelation = IndicateurThematiqueCreate;

type ImportDefinitionRow = typeof indicateurDefinitionTable.$inferInsert;

type ImportDefinitionSnapshot = Readonly<{
  identifiantReferentiel: string | null;
  periodicite: IndicateurPeriodicite;
  valeurCalcule: string | null;
}>;

type ImportObjectifRow = Readonly<{
  indicateurId: number;
  dateValeur: string;
  formule: string;
}>;

@Injectable()
export class ImportIndicateurDefinitionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findFirstIndicateurIdWithValeur(
    indicateurIds: number[],
    tx?: Transaction
  ): Promise<number | null> {
    if (indicateurIds.length === 0) {
      return null;
    }
    const [definition] = await (tx ?? this.databaseService.db)
      .select({ indicateurId: indicateurValeurTable.indicateurId })
      .from(indicateurValeurTable)
      .where(inArray(indicateurValeurTable.indicateurId, indicateurIds))
      .limit(1);
    return definition?.indicateurId ?? null;
  }

  listThematiques(tx?: Transaction) {
    return (tx ?? this.databaseService.db).select().from(thematiqueTable);
  }

  listCategories(tx?: Transaction) {
    return (tx ?? this.databaseService.db).select().from(categorieTagTable);
  }

  listDefinitionSnapshots(
    identifiantsReferentiel: string[],
    tx: Transaction
  ): Promise<ImportDefinitionSnapshot[]> {
    if (identifiantsReferentiel.length === 0) {
      return Promise.resolve([]);
    }
    return tx
      .select({
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        periodicite: indicateurDefinitionTable.periodicite,
        valeurCalcule: indicateurDefinitionTable.valeurCalcule,
      })
      .from(indicateurDefinitionTable)
      .where(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          identifiantsReferentiel
        )
      )
      .orderBy(asc(indicateurDefinitionTable.identifiantReferentiel));
  }

  async deleteGroupRelationsByChildIds(
    indicateurIds: number[],
    tx: Transaction
  ): Promise<void> {
    if (indicateurIds.length === 0) {
      return;
    }
    await tx
      .delete(indicateurGroupeTable)
      .where(inArray(indicateurGroupeTable.enfant, indicateurIds));
  }

  upsertDefinitions(definitions: ImportDefinitionRow[], tx: Transaction) {
    return tx
      .insert(indicateurDefinitionTable)
      .values(definitions)
      .onConflictDoUpdate({
        target: [indicateurDefinitionTable.identifiantReferentiel],
        set: buildConflictUpdateColumns(indicateurDefinitionTable, [
          'titre',
          'titreLong',
          'titreCourt',
          'unite',
          'borneMin',
          'borneMax',
          'collectiviteId',
          'participationScore',
          'sansValeurUtilisateur',
          'description',
          'valeurCalcule',
          'exprCible',
          'exprSeuil',
          'libelleCibleSeuil',
          'periodicite',
          'modifiedAt',
          'modifiedBy',
          'version',
        ]),
      })
      .returning();
  }

  createCategories(categories: CategorieTagCreate[], tx: Transaction) {
    return tx.insert(categorieTagTable).values(categories).returning();
  }

  createThematiques(thematiques: ThematiqueCreate[], tx: Transaction) {
    return tx.insert(thematiqueTable).values(thematiques).returning();
  }

  async replaceCategorieRelations(
    indicateurIds: number[],
    relations: ImportCategorieRelation[],
    tx: Transaction
  ): Promise<void> {
    if (indicateurIds.length > 0) {
      await tx
        .delete(indicateurCategorieTagTable)
        .where(
          inArray(indicateurCategorieTagTable.indicateurId, indicateurIds)
        );
    }
    if (relations.length > 0) {
      await tx.insert(indicateurCategorieTagTable).values(relations);
    }
  }

  async replaceThematiqueRelations(
    indicateurIds: number[],
    relations: ImportThematiqueRelation[],
    tx: Transaction
  ): Promise<void> {
    if (indicateurIds.length > 0) {
      await tx
        .delete(indicateurThematiqueTable)
        .where(inArray(indicateurThematiqueTable.indicateurId, indicateurIds));
    }
    if (relations.length > 0) {
      await tx.insert(indicateurThematiqueTable).values(relations);
    }
  }

  async replaceGroupRelations(
    indicateurIds: number[],
    relations: ImportGroupRelation[],
    tx: Transaction
  ): Promise<void> {
    if (indicateurIds.length > 0) {
      await tx
        .delete(indicateurGroupeTable)
        .where(inArray(indicateurGroupeTable.enfant, indicateurIds));
    }
    if (relations.length > 0) {
      await tx.insert(indicateurGroupeTable).values(relations);
    }
  }

  upsertObjectifs(objectifs: ImportObjectifRow[], tx: Transaction) {
    return tx
      .insert(indicateurObjectifTable)
      .values(objectifs)
      .onConflictDoUpdate({
        target: [
          indicateurObjectifTable.indicateurId,
          indicateurObjectifTable.dateValeur,
        ],
        set: buildConflictUpdateColumns(indicateurObjectifTable, ['formule']),
      });
  }
}
