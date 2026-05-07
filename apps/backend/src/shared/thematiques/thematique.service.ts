import { Injectable } from '@nestjs/common';
import { sousThematiqueTable } from '@tet/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { SousThematique, Thematique } from '@tet/domain/shared';
import { asc } from 'drizzle-orm';

@Injectable()
export class ThematiqueService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listThematiques(): Promise<Thematique[]> {
    return this.databaseService.db
      .select()
      .from(thematiqueTable)
      .orderBy(asc(thematiqueTable.nom));
  }

  async listSousThematiques(): Promise<SousThematique[]> {
    return this.databaseService.db.select().from(sousThematiqueTable);
  }
}
