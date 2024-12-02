import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from '../../common/services/database.service';
import {
  sousThematiqueTable,
  SousThematiqueType,
} from '../models/sous-thematique.table';

@Injectable()
export default class ThematiqueService {
  private readonly logger = new Logger(ThematiqueService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Récupère les sous thématiques provenant de la BDD
   * @return une map de sous thématiques avec en clé le nom de la sous thématique
   */
  async getSousThematiquesMap(): Promise<Map<string, SousThematiqueType>> {
    const result = await this.databaseService.db
      .select()
      .from(sousThematiqueTable);
    const toReturn = new Map<string, SousThematiqueType>();
    for (let i = 0; i < result.length; i++) {
      const thematique = result[i];
      toReturn.set(thematique.sousThematique, thematique);
    }
    return toReturn;
  }
}
