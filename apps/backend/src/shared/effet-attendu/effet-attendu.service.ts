import { effetAttenduTable } from '@/backend/shared/effet-attendu/effet-attendu.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { EffetAttendu } from '@/domain/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EffetAttenduService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEffetAttendu(): Promise<EffetAttendu[]> {
    return this.databaseService.db.select().from(effetAttenduTable);
  }
}
