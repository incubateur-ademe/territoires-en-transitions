import { Injectable, Logger } from '@nestjs/common';
import {
  ActionImpact,
  Partenaire,
  SousThematique,
} from '../models/directus.models';
import ConfigurationService from 'backend/src/config/configuration.service';

@Injectable()
export default class DirectusService {
  private readonly logger = new Logger(DirectusService.name);

  constructor(
    private readonly configurationService: ConfigurationService,
  ) {}

  private readonly directusKey =
    this.configurationService.get('DIRECTUS_API_KEY');
  private readonly headers = { Authorization: `Bearer ${this.directusKey}` };
  private readonly directusUrl = 'https://tet.directus.app';

  /**
   * Renvoie une liste d'élements d'une collection Directus donnée
   * On trouve les noms des collections dans l'url de Directus ex :
   * action_referentiel: https://tet.directus.app/admin/content/action_referentiel
   * @param collection nom de la table à récupérer de directus
   * @return le résultat de la requête
   */
  async getFromDirectus(collection: string): Promise<any> {
    const response = await fetch(
      `${this.directusUrl}/items/${collection}?fields[]=*.*&limit=-1`,
      {
        method: 'GET',
        headers: this.headers,
      },
    );

    if (!response.ok) {
      return null;
    }
    this.logger.log(`Récupération de la table ${collection} dans directus`);
    return await response.json();
  }

  /**
   * Récupère les actions à impact provenant de directus
   * @return les actions à impact
   */
  async getActionsImpactFromDirectus(): Promise<ActionImpact[]> {
    return (await this.getFromDirectus('action_impact'))
      ?.data as ActionImpact[];
  }

  /**
   * Récupère les sous thématiques provenant de directus
   * @return les sous thématiques
   */
  async getSousThematiquesFromDirectus(): Promise<SousThematique[]> {
    return (await this.getFromDirectus('sous_thematique'))
      ?.data as SousThematique[];
  }

  /**
   * Récupère les partenaires provenant de directus
   * @return les partenaires
   */
  async getPartenairesFromDirectus(): Promise<Partenaire[]> {
    return (await this.getFromDirectus('action_impact_partenaire'))
      ?.data as Partenaire[];
  }
}
