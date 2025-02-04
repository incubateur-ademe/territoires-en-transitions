import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/backend/utils';
import { EffetAttendu, effetAttenduTable } from '@/backend/shared';

@Injectable()
export class EffetAttenduService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEffetAttendu(): Promise<EffetAttendu[]> {
    return this.databaseService.db.select().from(effetAttenduTable);
  }
}
