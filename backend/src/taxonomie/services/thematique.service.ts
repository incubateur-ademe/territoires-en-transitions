import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import {
  SousThematique,
  sousThematiqueTable,
} from '../../shared/models/sous-thematique.table';

@Injectable()
export default class ThematiqueService {
  private readonly logger = new Logger(ThematiqueService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Récupère les sous thématiques provenant de la BDD
   * @return une map de sous thématiques avec en clé le nom de la sous thématique
   */
  async getSousThematiquesMap(): Promise<Map<string, SousThematique>> {
    const result = await this.databaseService.db
      .select()
      .from(sousThematiqueTable);
    const toReturn = new Map<string, SousThematique>();
    for (let i = 0; i < result.length; i++) {
      const thematique = result[i];
      toReturn.set(thematique.nom, thematique);
    }
    return toReturn;
  }
}
