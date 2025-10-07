import { Injectable, Logger } from '@nestjs/common';
import { chunk, flatten } from 'es-toolkit';
import { ZodSchema } from 'zod';
import ConfigurationService from '../config/configuration.service';
import { GetNICResponse, getNICResponseSchema } from './sirene.model';

// l'API autorise au maximum 1000 éléments par réponse
const MAX_RESULTS = 1000;

@Injectable()
export class SireneService {
  private logger = new Logger(SireneService.name);

  constructor(private readonly configurationService: ConfigurationService) {}

  /** Fait un appel POST à l'API */
  private async post<T>(
    endpoint: string,
    body: Record<string, string>,
    schema: ZodSchema
  ) {
    const response = await fetch(
      `${this.configurationService.get('SIRENE_API_URL')}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
          'accept-encoding': 'gzip',
          'X-INSEE-Api-Key-Integration':
            this.configurationService.get('SIRENE_API_KEY'),
        },
        body: new URLSearchParams(body).toString(),
      }
    );

    if (!response.ok) {
      this.logger.log(
        `Erreur requête SIRENE ${endpoint} (${response.status}: ${response.statusText})`
      );
      return null;
    }

    const content = await response.json();
    return schema.parse(content) as T;
  }

  /**
   * Détermine le NIC du siège légal
   * de chaque collectivité à partir de son SIREN.
   */
  async getNIC(listSiren: string[]) {
    // si nécessaire, la liste est découpée en pages pour ne pas excéder le
    // quota de l'API
    const result = await Promise.all(
      chunk(listSiren, MAX_RESULTS).map((page) => this.getNICFromSIREN(page))
    );
    return flatten(result);
  }

  private async getNICFromSIREN(listSiren: string[]) {
    this.logger.log(`Recherche de ${listSiren.length} code(s) NIC`);
    const response = await this.post<GetNICResponse>(
      'siren',
      {
        q: `(${listSiren.map((siren) => `siren:${siren}`).join(' OR ')})`,
        champs: 'siren,nicSiegeUniteLegale',
        nombre: listSiren.length.toString(),
      },
      getNICResponseSchema
    );
    if (!response?.unitesLegales?.length) {
      return [];
    }

    const result: Array<{ siren: string; nic: string }> = [];
    listSiren.forEach((siren) => {
      const nic = response.unitesLegales
        .find((ul) => ul.siren === siren)
        ?.periodesUniteLegale?.find(
          (p) => p.dateFin === null
        )?.nicSiegeUniteLegale;

      if (nic) {
        result.push({ siren, nic });
      }
    });

    this.logger.log(`${result.length} code(s) NIC trouvé(s)`);

    return result;
  }
}
