import { Injectable } from '@nestjs/common';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type {
  Indicateur,
  IndicateurNatureFields,
  IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { and, eq, isNotNull } from 'drizzle-orm';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../indicateur-definition.table';

type IndicateurPersoKey = Readonly<{
  indicateurId: number;
  collectiviteId: number;
}>;

type CreateIndicateurPerso = Readonly<{
  collectiviteId: number;
  titre: string;
  unite: string;
  periodicite: IndicateurPeriodicite;
  thematiqueIds: number[];
  commentaire?: string;
  estFavori: boolean;
  estConfidentiel: boolean;
  isApplicable: boolean;
  modifiedBy: string;
}>;

type UpdateCollectiviteFields = IndicateurPersoKey &
  Readonly<{
    isApplicable?: boolean;
    isSuivi?: boolean;
    commentaire?: string;
    confidentiel?: boolean;
    favoris?: boolean;
    modifiedBy: string;
  }>;

type UpdateIndicateurPersoFields = IndicateurPersoKey &
  Partial<Pick<Indicateur, 'titre' | 'unite'>>;

@Injectable()
export class MutateIndicateurRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createIndicateurPerso(
    input: CreateIndicateurPerso,
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
        isApplicable: input.isApplicable,
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
          'isApplicable',
          'modifiedBy',
        ]),
      });

    return indicateur.id;
  }

  async getIndicateurNature(
    indicateurId: number
  ): Promise<IndicateurNatureFields | null> {
    const [definition] = await this.databaseService.db
      .select({
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        groupementId: indicateurDefinitionTable.groupementId,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    return definition ?? null;
  }

  async lockIndicateurNature(
    indicateurId: number,
    tx: Transaction
  ): Promise<IndicateurNatureFields | null> {
    const [definition] = await tx
      .select({
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        groupementId: indicateurDefinitionTable.groupementId,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1)
      .for('update');

    return definition ?? null;
  }

  async lockGroupementMembership(
    {
      groupementId,
      collectiviteId,
    }: { groupementId: number; collectiviteId: number },
    tx: Transaction
  ): Promise<boolean> {
    const [membership] = await tx
      .select({ groupementId: groupementCollectiviteTable.groupementId })
      .from(groupementCollectiviteTable)
      .where(
        and(
          eq(groupementCollectiviteTable.groupementId, groupementId),
          eq(groupementCollectiviteTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1)
      .for('share');

    return Boolean(membership);
  }

  async deleteIndicateurPerso(
    { indicateurId, collectiviteId }: IndicateurPersoKey,
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
      isApplicable,
      isSuivi,
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
        ...(isApplicable !== undefined && { isApplicable }),
        ...(isSuivi !== undefined && { isSuivi }),
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
          ...(isApplicable !== undefined && { isApplicable }),
          ...(isSuivi !== undefined && { isSuivi }),
          ...(commentaire !== undefined && { commentaire }),
          ...(confidentiel !== undefined && { confidentiel }),
          ...(favoris !== undefined && { favoris }),
          modifiedBy,
          modifiedAt: SQL_CURRENT_TIMESTAMP,
        },
      });
  }

  async updateIndicateurPerso(
    { indicateurId, collectiviteId, titre, unite }: UpdateIndicateurPersoFields,
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

  async touchIndicateurs(
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
