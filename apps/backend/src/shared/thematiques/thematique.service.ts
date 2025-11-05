import { sousThematiqueTable } from '@/backend/shared/thematiques/sous-thematique.table';
import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { SousThematique, Thematique } from '@/domain/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThematiqueService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getThematiques(): Promise<Thematique[]> {
    return this.databaseService.db.select().from(thematiqueTable);
  }

  async getSousThematiques(): Promise<SousThematique[]> {
    return this.databaseService.db.select().from(sousThematiqueTable);
  }
}
