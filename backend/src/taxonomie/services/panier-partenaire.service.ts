import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import DirectusService from '../../directus/service/directus.service';
import { panierPartenaireTable } from '../models/panier-partenaire.table';

@Injectable()
export default class PanierPartenaireService {
  private readonly logger = new Logger(PanierPartenaireService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly directusService: DirectusService,
  ) {}

  /**
   * Met à jour les partenaires depuis directus
   */
  async majPartenairePanierFromDirectus() {
    const partenaires = await this.directusService.getPartenairesFromDirectus();
    await this.databaseService.db
      .insert(panierPartenaireTable)
      .values(partenaires)
      .onConflictDoUpdate({
        target: panierPartenaireTable.id,
        set: { nom: sql.raw(`excluded.name`) },
      });
    Logger.log('Sauvegarde des partenaires réussi');
  }
}
