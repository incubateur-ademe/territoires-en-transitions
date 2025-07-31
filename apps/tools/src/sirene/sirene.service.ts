import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { chunk, flatten } from 'es-toolkit';
import { objectToCamel } from 'ts-case-convert';
import { ZodSchema } from 'zod';
import ConfigurationService from '../config/configuration.service';
import {
  GetNICResponse,
  getNICResponseSchema,
  getTokenResponseSchema,
} from './sirene.model';

// l'API autorise au maximum 1000 éléments par réponse
const MAX_RESULTS = 1000;

@Injectable()
export class SireneService {
  private logger = new Logger(SireneService.name);
  private accessToken: string | undefined = undefined;
  private expiresAt: number | undefined = undefined;

  constructor(private readonly configurationService: ConfigurationService) {}

  /** Récupère/rafraichit le jeton d'accès */
  private async getAccessToken(refresh = false) {
    // renvoi le jeton courant si il est encore valide et que le
    // rafraichissement n'est pas forcé
    const expired = Date.now() >= (this.expiresAt ?? 0);
    if (this.accessToken && !expired && !refresh) {
      this.logger.log(
        `Jeton accès SIRENE valide jusqu'à ${new Date(
          this.expiresAt as number
        ).toISOString()}`
      );
      return this.accessToken;
    }

    // demande le jeton
    const options ={
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Basic ${this.configurationService.get(
          'SIRENE_API_KEY'
        )}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    }
    const response = await fetch(this.configurationService.get('SIRENE_AUTH_URL'), options);

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erreur de création du jeton SIRENE (${response.status}: ${response.statusText})\n${JSON.stringify(options)}`
      );
    }

    const content = await response.json();
    const result = getTokenResponseSchema.parse(content);
    const { accessToken, expiresIn } = objectToCamel(result);

    this.accessToken = accessToken;
    this.expiresAt = Date.now() + expiresIn * 1000;
    this.logger.log(
      `Nouveau jeton d'accès SIRENE, valide jusqu'à ${new Date(
        this.expiresAt as number
      ).toISOString()}`
    );

    return this.accessToken;
  }

  /** Fait un appel POST à l'API */
  private async post<T>(endpoint: string, body: Record<string, string>, schema: ZodSchema) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.configurationService.get('SIRENE_API_URL')}/${endpoint}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
        'accept-encoding': 'gzip',
        authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams(body).toString(),
    });

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
