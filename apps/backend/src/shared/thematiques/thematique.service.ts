import {
  SousThematique,
  sousThematiqueTable,
} from '@/backend/shared/thematiques/sous-thematique.table';
import {
  Thematique,
  thematiqueTable,
} from '@/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
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
