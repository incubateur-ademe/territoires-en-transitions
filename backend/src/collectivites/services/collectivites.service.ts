import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import DatabaseService from '../../common/services/database.service';

export const collectiviteTable = pgTable('collectivite', {
  id: serial('id').primaryKey(),
  access_restreint: boolean('access_restreint'),
});
export type CollectiviteType = InferSelectModel<typeof collectiviteTable>;
export type CreateCollectiviteType = InferInsertModel<typeof collectiviteTable>;

export const epciTable = pgTable('epci', {
  id: serial('id').primaryKey(),
  collectivite_id: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  nom: text('nom').notNull(),
  siren: text('siren'),
});
export type EpciType = InferSelectModel<typeof epciTable>;
export type CreateEpciType = InferInsertModel<typeof epciTable>;

@Injectable()
export default class CollectivitesService {
  private readonly logger = new Logger(CollectivitesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getEpciByCollectiviteId(collectiviteId: number) {
    this.logger.log(
      `Récupération de l'epci avec l'identifiant ${collectiviteId}`,
    );
    const epciByIdResult = await this.databaseService.db
      .select()
      .from(epciTable)
      .where(eq(epciTable.collectivite_id, collectiviteId));
    if (!epciByIdResult?.length) {
      throw new NotFoundException(
        `EPCI avec l'identifiant de collectivite ${collectiviteId} introuvable`,
      );
    }

    this.logger.log(`Epci trouvé avec l'id ${epciByIdResult[0].id}`);
    return epciByIdResult[0];
  }

  async getEpciBySiren(siren: string) {
    this.logger.log(`Récupération de l'epci à partir du siren ${siren}`);
    const epciBySirenResult = await this.databaseService.db
      .select()
      .from(epciTable)
      .where(eq(epciTable.siren, siren));
    if (!epciBySirenResult?.length) {
      throw new NotFoundException(`EPCI avec le siren ${siren} introuvable`);
    }
    this.logger.log(`Epci trouvé avec l'id ${epciBySirenResult[0].id}`);
    return epciBySirenResult[0];
  }
}
