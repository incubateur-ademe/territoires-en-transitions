import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import DatabaseService from 'src/common/services/database.service';

@Injectable()
export default class CollectivitesService {
  private readonly collectiviteTable = pgTable('collectivite', {
    id: serial('id').primaryKey(),
    access_restreint: boolean('access_restreint'),
  });

  private readonly epciTable = pgTable('epci', {
    id: serial('id').primaryKey(),
    collectivite_id: integer('collectivite_id')
      .notNull()
      .references(() => this.collectiviteTable.id),
    nom: text('nom').notNull(),
    siren: text('siren'),
  });

  constructor(private readonly databaseService: DatabaseService) {}

  async getEpciById(id: number) {
    return this.databaseService.db
      .select()
      .from(this.epciTable)
      .where(eq(this.epciTable.id, id));
  }

  async getEpciBySiren(siren: string) {
    return this.databaseService.supabaseDb
      .from('epci')
      .select('*')
      .eq('siren', siren);
  }
}
