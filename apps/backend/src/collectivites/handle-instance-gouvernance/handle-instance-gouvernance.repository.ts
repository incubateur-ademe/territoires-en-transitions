import { Injectable } from '@nestjs/common';
import { ficheActionInstanceGouvernanceTableTag } from '@tet/backend/plans/fiches/shared/models/fiche-action-instance-gouvernance';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  InstanceGouvernance,
  instanceGouvernanceTagSchema,
} from '@tet/domain/collectivites';
import { and, eq, ne } from 'drizzle-orm';
import { instanceGouvernanceTagTable } from '../tags/instance-gouvernance.table';
import { Result } from './handle-instance-gouvernance.result';

@Injectable()
export class InstanceGouvernanceRepository {
  constructor(private readonly databaseService: DatabaseService) {}
  async create({
    nom,
    collectiviteId,
    userId,
    tx,
  }: {
    nom: string;
    collectiviteId: number;
    userId: string;
    tx?: Transaction;
  }): Promise<Result> {
    try {
      const [instanceGouvernance] = await (tx ?? this.databaseService.db)
        .insert(instanceGouvernanceTagTable)
        .values({
          nom,
          collectiviteId,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [
            instanceGouvernanceTagTable.nom,
            instanceGouvernanceTagTable.collectiviteId,
          ],
          set: {
            createdBy: userId,
            createdAt: new Date().toISOString(),
          },
        })
        .returning();
      const parsedResult =
        instanceGouvernanceTagSchema.safeParse(instanceGouvernance);
      if (!parsedResult.success) {
        return failure('DATABASE_ERROR', parsedResult.error);
      }
      return parsedResult;
    } catch (error) {
      return failure('SERVER_ERROR', error as Error);
    }
  }
  async list(collectiviteId: number): Promise<Result<InstanceGouvernance[]>> {
    try {
      const result = await this.databaseService.db
        .select()
        .from(instanceGouvernanceTagTable)
        .where(eq(instanceGouvernanceTagTable.collectiviteId, collectiviteId));

      const parsedResult = result
        .map((instance) => instanceGouvernanceTagSchema.safeParse(instance))
        .filter((result) => result.success)
        .map((result) => result.data);

      return { success: true, data: parsedResult };
    } catch (error) {
      return failure('SERVER_ERROR', error as Error);
    }
  }
  async delete(id: number): Promise<Result<boolean>> {
    try {
      const result = await this.databaseService.db.transaction(async (tx) => {
        await tx
          .delete(ficheActionInstanceGouvernanceTableTag)
          .where(
            eq(
              ficheActionInstanceGouvernanceTableTag.instanceGouvernanceTagId,
              id
            )
          );
        await tx
          .delete(instanceGouvernanceTagTable)
          .where(eq(instanceGouvernanceTagTable.id, id))
          .returning();
        return true;
      });
      return result ? success(result) : failure('DATABASE_ERROR');
    } catch (error) {
      return failure('SERVER_ERROR', error as Error);
    }
  }
  async update(id: number, nom: string): Promise<Result<InstanceGouvernance>> {
    try {
      const [currentInstance] = await this.databaseService.db
        .select()
        .from(instanceGouvernanceTagTable)
        .where(eq(instanceGouvernanceTagTable.id, id))
        .limit(1);

      if (!currentInstance) {
        return failure('NOT_FOUND');
      }

      const [existingInstance] = await this.databaseService.db
        .select()
        .from(instanceGouvernanceTagTable)
        .where(
          and(
            eq(instanceGouvernanceTagTable.nom, nom),
            eq(
              instanceGouvernanceTagTable.collectiviteId,
              currentInstance.collectiviteId
            ),
            ne(instanceGouvernanceTagTable.id, id)
          )
        )
        .limit(1);

      if (existingInstance) {
        return failure('DUPLICATE_NAME');
      }

      const [result] = await this.databaseService.db
        .update(instanceGouvernanceTagTable)
        .set({ nom })
        .where(eq(instanceGouvernanceTagTable.id, id))
        .returning();
      const parsedResult = instanceGouvernanceTagSchema.safeParse(result);
      if (!parsedResult.success) {
        return failure('DATABASE_ERROR', parsedResult.error);
      }
      return success(result);
    } catch (error) {
      return failure('DATABASE_ERROR', error as Error);
    }
  }
}
