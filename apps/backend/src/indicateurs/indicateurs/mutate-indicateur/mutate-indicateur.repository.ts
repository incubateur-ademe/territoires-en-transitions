import { Injectable, Logger } from '@nestjs/common';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import type {
  Indicateur,
  IndicateurInGroup,
  IndicateurNatureFields,
  IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { and, eq, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurCollectiviteTable } from '../../indicateur/indicateur-collectivite.table';
import { indicateurDefinitionTable } from '../../indicateur/indicateur-definition.table';

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
  private readonly logger = new Logger(MutateIndicateurRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createIndicateurPerso(
    input: CreateIndicateurPerso,
    tx: Transaction
  ): Promise<Result<number, 'DATABASE_ERROR'>> {
    try {
      return success(await this.insertIndicateurPerso(input, tx));
    } catch (error) {
      this.logger.error(
        `Erreur d'insertion de l'indicateur personnalisé pour la collectivité "${input.collectiviteId}"`,
        error
      );
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  private async insertIndicateurPerso(
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

  async getParentInGroup(
    { parentId, collectiviteId }: { parentId: number; collectiviteId: number },
    tx: Transaction
  ): Promise<IndicateurInGroup | null> {
    const [parent] = await tx
      .select({
        id: indicateurDefinitionTable.id,
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        unite: indicateurDefinitionTable.unite,
        periodicite: indicateurDefinitionTable.periodicite,
      })
      .from(indicateurDefinitionTable)
      .where(
        and(
          eq(indicateurDefinitionTable.id, parentId),
          or(
            eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
      )
      .limit(1);

    if (!parent) {
      return null;
    }

    const [grandParent] = await tx
      .select({ parent: indicateurGroupeTable.parent })
      .from(indicateurGroupeTable)
      .where(eq(indicateurGroupeTable.enfant, parentId))
      .limit(1);

    const [firstChild] = await tx
      .select({ enfant: indicateurGroupeTable.enfant })
      .from(indicateurGroupeTable)
      .where(eq(indicateurGroupeTable.parent, parentId))
      .limit(1);

    return {
      ...parent,
      parentId: grandParent?.parent ?? null,
      hasChildren: firstChild !== undefined,
    };
  }

  async listSousIndicateurs(
    { parentId, collectiviteId }: { parentId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<{ id: number; parentId: number }[]> {
    const rows = await (tx ?? this.databaseService.db)
      .select({ id: indicateurDefinitionTable.id })
      .from(indicateurGroupeTable)
      .innerJoin(
        indicateurDefinitionTable,
        eq(indicateurDefinitionTable.id, indicateurGroupeTable.enfant)
      )
      .where(
        and(
          eq(indicateurGroupeTable.parent, parentId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId)
        )
      );

    return rows.map(({ id }) => ({ id, parentId }));
  }

  async updateSousIndicateursUnite(
    {
      parentId,
      collectiviteId,
      unite,
    }: { parentId: number; collectiviteId: number; unite: string },
    tx: Transaction
  ): Promise<void> {
    await tx
      .update(indicateurDefinitionTable)
      .set({ unite })
      .where(
        and(
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
          inArray(
            indicateurDefinitionTable.id,
            tx
              .select({ id: indicateurGroupeTable.enfant })
              .from(indicateurGroupeTable)
              .where(eq(indicateurGroupeTable.parent, parentId))
          )
        )
      );
  }

  async attachSousIndicateur(
    { parentId, enfantId }: { parentId: number; enfantId: number },
    tx: Transaction
  ): Promise<void> {
    await tx
      .insert(indicateurGroupeTable)
      .values({ parent: parentId, enfant: enfantId });
  }

  async getIndicateurNature(
    indicateurId: number
  ): Promise<IndicateurNatureFields | null> {
    const [indicateur] = await this.databaseService.db
      .select({
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        groupementId: indicateurDefinitionTable.groupementId,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    return indicateur ?? null;
  }

  async lockIndicateurNature(
    indicateurId: number,
    tx: Transaction
  ): Promise<IndicateurNatureFields | null> {
    const [indicateur] = await tx
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

    return indicateur ?? null;
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
    const [deletedIndicateur] = await tx
      .delete(indicateurDefinitionTable)
      .where(
        and(
          eq(indicateurDefinitionTable.id, indicateurId),
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
          isNotNull(indicateurDefinitionTable.collectiviteId)
        )
      )
      .returning({ id: indicateurDefinitionTable.id });

    return Boolean(deletedIndicateur);
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
    const updatedIndicateurs = await tx
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

    return updatedIndicateurs.length > 0;
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
