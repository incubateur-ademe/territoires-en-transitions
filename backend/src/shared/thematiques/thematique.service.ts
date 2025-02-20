import { DatabaseService } from '@/backend/utils';
import {
  SousThematique,
  sousThematiqueTable,
  Thematique,
  thematiqueTable,
} from '@/domain/shared';
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
