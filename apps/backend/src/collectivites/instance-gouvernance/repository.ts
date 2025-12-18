import { Injectable } from '@nestjs/common';
import { ficheActionInstanceGouvernanceTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-instance-gouvernance';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  InstanceGouvernance,
  instanceGouvernanceTagSchema,
} from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { instanceGouvernanceTable } from '../tags/instance-gouvernance.table';
import { Result } from './result';

@Injectable()
export class InstanceGouvernanceRepository {
  constructor(private readonly databaseService: DatabaseService) {}
  async create({
    nom,
    actionId,
    collectiviteId,
    userId,
  }: {
    nom: string;
    actionId: number;
    collectiviteId: number;
    userId: string;
  }): Promise<Result<InstanceGouvernance>> {
    try {
      const result = await this.databaseService.db.transaction(async (tx) => {
        const [instanceGouvernance] = await tx
          .insert(instanceGouvernanceTable)
          .values({ nom, collectiviteId, createdBy: userId })
          .returning();

        await tx.insert(ficheActionInstanceGouvernanceTable).values({
          ficheId: actionId,
          instanceGouvernanceId: instanceGouvernance.id,
          createdBy: userId,
        });
        return instanceGouvernance;
      });
      const parsedResult = instanceGouvernanceTagSchema.safeParse(result);
      if (!parsedResult.success) {
        return {
          success: false,
          error: 'NOT_FOUND',
          cause: parsedResult.error.message,
        };
      }
      return { success: true, data: parsedResult.data };
    } catch (error) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        cause: (error as Error).message,
      };
    }
  }
  async list(collectiviteId: number): Promise<Result<InstanceGouvernance[]>> {
    try {
      const result = await this.databaseService.db
        .select()
        .from(instanceGouvernanceTable)
        .where(eq(instanceGouvernanceTable.collectiviteId, collectiviteId));

      const parsedResult = result
        .map((instance) => instanceGouvernanceTagSchema.safeParse(instance))
        .filter((result) => result.success)
        .map((result) => result.data);

      return { success: true, data: parsedResult };
    } catch (error) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        cause: (error as Error).message,
      };
    }
  }
  async delete(id: number): Promise<Result<boolean>> {
    try {
      const result = await this.databaseService.db.transaction(async (tx) => {
        await tx
          .delete(ficheActionInstanceGouvernanceTable)
          .where(
            eq(ficheActionInstanceGouvernanceTable.instanceGouvernanceId, id)
          );
        await tx
          .delete(instanceGouvernanceTable)
          .where(eq(instanceGouvernanceTable.id, id))
          .returning();
        return true;
      });
      return result
        ? { success: true, data: result }
        : {
            success: false,
            error: 'SERVER_ERROR',
          };
    } catch (error) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        cause: (error as Error).message,
      };
    }
  }
  async update(id: number, nom: string): Promise<Result<InstanceGouvernance>> {
    try {
      const [result] = await this.databaseService.db
        .update(instanceGouvernanceTable)
        .set({ nom })
        .where(eq(instanceGouvernanceTable.id, id))
        .returning();
      const parsedResult = instanceGouvernanceTagSchema.safeParse(result);
      if (!parsedResult.success) {
        return {
          success: false,
          error: 'NOT_FOUND',
          cause: parsedResult.error.message,
        };
      }
      return { success: true, data: parsedResult.data };
    } catch (error) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        cause: (error as Error).message,
      };
    }
  }
}
