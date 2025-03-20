import { EffetAttendu, effetAttenduTable } from '@/backend/shared/index-domain';
import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EffetAttenduService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEffetAttendu(): Promise<EffetAttendu[]> {
    return this.databaseService.db.select().from(effetAttenduTable);
  }
}
