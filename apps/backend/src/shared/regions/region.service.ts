import { Injectable } from '@nestjs/common';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Region } from '@tet/domain/shared';
import { asc } from 'drizzle-orm';

@Injectable()
export class RegionService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listRegions(): Promise<Region[]> {
    return this.databaseService.db
      .select()
      .from(regionTable)
      .orderBy(asc(regionTable.libelle));
  }
}
