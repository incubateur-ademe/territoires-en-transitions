import { effetAttenduTable } from '@tet/backend/shared/effet-attendu/effet-attendu.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Injectable } from '@nestjs/common';
import { EffetAttendu } from '@tet/domain/shared';

@Injectable()
export class EffetAttenduService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEffetAttendu(): Promise<EffetAttendu[]> {
    return this.databaseService.db.select().from(effetAttenduTable);
  }
}
