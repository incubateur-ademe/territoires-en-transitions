import { Injectable } from '@nestjs/common';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type {
  IndicateurDefinition,
  IndicateurPeriodicite,
  IndicateurPeriodiciteMode,
} from '@tet/domain/indicateurs';
import { and, eq, isNotNull } from 'drizzle-orm';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../indicateur-definition.table';

type PersonalizedDefinitionKey = Readonly<{
  indicateurId: number;
  collectiviteId: number;
}>;

type CreatePersonalizedDefinition = Readonly<{
  collectiviteId: number;
  titre: string;
  unite: string;
  periodicite: IndicateurPeriodicite;
  thematiqueIds: number[];
  commentaire?: string;
  estFavori: boolean;
  estConfidentiel: boolean;
  modifiedBy: string;
}>;

export type DefinitionOwnership = Readonly<{
  periodiciteMode: IndicateurPeriodiciteMode;
  collectiviteId: number | null;
  periodicite: IndicateurPeriodicite;
}>;

type UpdateCollectiviteFields = PersonalizedDefinitionKey &
  Readonly<{
    periodicite?: IndicateurPeriodicite | null;
    commentaire?: string;
    confidentiel?: boolean;
    favoris?: boolean;
    modifiedBy: string;
  }>;

type UpdatePersonalizedDefinitionFields = PersonalizedDefinitionKey &
  Partial<Pick<IndicateurDefinition, 'titre' | 'unite'>>;

@Injectable()
export class MutateDefinitionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createPersonalizedDefinition(
    input: CreatePersonalizedDefinition,
    tx: Transaction
  ): Promise<number> {
    const [indicateur] = await tx
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: input.collectiviteId,
        titre: input.titre,
        unite: input.unite,
        periodicite: input.periodicite,
      })
      .returning({ id: indicateurDefinitionTable.id });

    if (!indicateur) {
      throw new Error(
        `Erreur d'insertion de l'indicateur personnalisé pour la collectivité "${input.collectiviteId}"`
      );
    }

    if (input.thematiqueIds.length > 0) {
      await tx
        .insert(indicateurThematiqueTable)
        .values(
          input.thematiqueIds.map((thematiqueId) => ({
            indicateurId: indicateur.id,
            thematiqueId,
          }))
        )
        .onConflictDoNothing();
    }

    await tx
      .insert(indicateurCollectiviteTable)
      .values({
        collectiviteId: input.collectiviteId,
        indicateurId: indicateur.id,
        commentaire: input.commentaire,
        favoris: input.estFavori,
        confidentiel: input.estConfidentiel,
        modifiedBy: input.modifiedBy,
      })
      .onConflictDoUpdate({
        target: [
          indicateurCollectiviteTable.indicateurId,
          indicateurCollectiviteTable.collectiviteId,
        ],
        set: buildConflictUpdateColumns(indicateurCollectiviteTable, [
          'commentaire',
          'favoris',
          'confidentiel',
          'modifiedBy',
        ]),
      });

    return indicateur.id;
  }

  async getDefinitionOwnership(
    indicateurId: number
  ): Promise<DefinitionOwnership | null> {
    const [definition] = await this.databaseService.db
      .select({
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        periodicite: indicateurDefinitionTable.periodicite,
        periodiciteMode: indicateurDefinitionTable.periodiciteMode,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    return definition ?? null;
  }

  async lockDefinitionOwnership(
    indicateurId: number,
    tx: Transaction
  ): Promise<DefinitionOwnership | null> {
    const [definition] = await tx
      .select({
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        periodicite: indicateurDefinitionTable.periodicite,
        periodiciteMode: indicateurDefinitionTable.periodiciteMode,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1)
      .for('update');

    return definition ?? null;
  }

  async deletePersonalizedDefinition(
    { indicateurId, collectiviteId }: PersonalizedDefinitionKey,
    tx: Transaction
  ): Promise<boolean> {
    const [deletedDefinition] = await tx
      .delete(indicateurDefinitionTable)
      .where(
        and(
          eq(indicateurDefinitionTable.id, indicateurId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
          isNotNull(indicateurDefinitionTable.collectiviteId)
        )
      )
      .returning({ id: indicateurDefinitionTable.id });

    return Boolean(deletedDefinition);
  }

  async upsertCollectiviteFields(
    {
      indicateurId,
      collectiviteId,
      commentaire,
      periodicite,
      confidentiel,
      favoris,
      modifiedBy,
    }: UpdateCollectiviteFields,
    tx: Transaction
  ): Promise<void> {
    await tx
      .insert(indicateurCollectiviteTable)
      .values({
        indicateurId,
        collectiviteId,
        ...(periodicite !== undefined && { periodicite }),
        ...(commentaire !== undefined && { commentaire }),
        ...(confidentiel !== undefined && { confidentiel }),
        ...(favoris !== undefined && { favoris }),
        modifiedBy,
        modifiedAt: SQL_CURRENT_TIMESTAMP,
      })
      .onConflictDoUpdate({
        target: [
          indicateurCollectiviteTable.indicateurId,
          indicateurCollectiviteTable.collectiviteId,
        ],
        set: {
          ...(periodicite !== undefined && { periodicite }),
          ...(commentaire !== undefined && { commentaire }),
          ...(confidentiel !== undefined && { confidentiel }),
          ...(favoris !== undefined && { favoris }),
          modifiedBy,
          modifiedAt: SQL_CURRENT_TIMESTAMP,
        },
      });
  }

  async updatePersonalizedDefinition(
    {
      indicateurId,
      collectiviteId,
      titre,
      unite,
    }: UpdatePersonalizedDefinitionFields,
    tx: Transaction
  ): Promise<boolean> {
    const updatedDefinitions = await tx
      .update(indicateurDefinitionTable)
      .set({
        ...(titre !== undefined && { titre }),
        ...(unite !== undefined && { unite }),
      })
      .where(
        and(
          eq(indicateurDefinitionTable.id, indicateurId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
          isNotNull(indicateurDefinitionTable.collectiviteId)
        )
      )
      .returning({ id: indicateurDefinitionTable.id });

    return updatedDefinitions.length > 0;
  }

  async touchDefinitions(
    {
      indicateurIds,
      collectiviteId,
      modifiedBy,
    }: {
      indicateurIds: number[];
      collectiviteId: number;
      modifiedBy: string | null;
    },
    tx?: Transaction
  ): Promise<void> {
    if (indicateurIds.length === 0) {
      return;
    }

    await (tx ?? this.databaseService.db)
      .insert(indicateurCollectiviteTable)
      .values(
        indicateurIds.map((indicateurId) => ({
          indicateurId,
          collectiviteId,
          modifiedBy,
          modifiedAt: SQL_CURRENT_TIMESTAMP,
        }))
      )
      .onConflictDoUpdate({
        target: [
          indicateurCollectiviteTable.indicateurId,
          indicateurCollectiviteTable.collectiviteId,
        ],
        set: {
          modifiedBy,
          modifiedAt: SQL_CURRENT_TIMESTAMP,
        },
      });
  }
}
