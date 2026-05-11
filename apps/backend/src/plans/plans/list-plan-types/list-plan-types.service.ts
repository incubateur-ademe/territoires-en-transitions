import { Injectable } from '@nestjs/common';
import { planActionTypeTable } from '@tet/backend/plans/fiches/shared/models/plan-action-type.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PlanType } from '@tet/domain/plans';
import { asc } from 'drizzle-orm';

@Injectable()
export class ListPlanTypesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listPlanTypes(): Promise<PlanType[]> {
    return this.databaseService.db
      .select()
      .from(planActionTypeTable)
      .orderBy(
        asc(planActionTypeTable.categorie),
        asc(planActionTypeTable.type),
        asc(planActionTypeTable.id)
      );
  }
}
