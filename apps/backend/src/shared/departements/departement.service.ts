import { Injectable } from '@nestjs/common';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Departement } from '@tet/domain/shared';
import { asc } from 'drizzle-orm';

@Injectable()
export class DepartementService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listDepartements(): Promise<Departement[]> {
    return this.databaseService.db
      .select()
      .from(departementTable)
      .orderBy(asc(departementTable.libelle));
  }
}
