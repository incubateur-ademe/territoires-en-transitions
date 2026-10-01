import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ReponseSecteursCommuns,
  reponseSecteursCommunsSchema,
} from '@tet/domain/plans';
import { getErrorMessage } from '@tet/domain/utils';

const TIMEOUT_MS = 10_000;

export type SecteursCommunsLookup =
  | {
      statut: 'trouvee';
      reponse: ReponseSecteursCommuns;
      reponseBrute: unknown;
    }
  | { statut: 'inconnue' };

export type CommunsSecteursClientError =
  | 'COMMUNS_NON_CONFIGURE'
  | 'COMMUNS_ACCES_REFUSE'
  | 'COMMUNS_INJOIGNABLE'
  | 'COMMUNS_REPONSE_INATTENDUE';

@Injectable()
export class CommunsSecteursClient {
  private readonly logger = new Logger(CommunsSecteursClient.name);

  constructor(private readonly configurationService: ConfigurationService) {
    if (
      !configurationService.get('COMMUNS_API_URL') ||
      !configurationService.get('COMMUNS_API_KEY')
    ) {
      this.logger.error(
        'COMMUNS_API_URL ou COMMUNS_API_KEY absente : les secteurs des fiches ne seront pas récupérés'
      );
    }
  }

  async getSecteurs(
    ficheId: number
  ): Promise<Result<SecteursCommunsLookup, CommunsSecteursClientError>> {
    const baseUrl = this.configurationService.get('COMMUNS_API_URL');
    const apiKey = this.configurationService.get('COMMUNS_API_KEY');
    if (!baseUrl || !apiKey) {
      return failure('COMMUNS_NON_CONFIGURE');
    }

    const url = new URL(`/tet/v1/actions/${ficheId}/secteurs`, baseUrl);
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(
        `Communs injoignable pour la fiche ${ficheId} : ${getErrorMessage(
          error
        )}`
      );
      return failure('COMMUNS_INJOIGNABLE', error as Error);
    }

    if (response.status === 404) {
      return success({ statut: 'inconnue' });
    }
    if (response.status === 401 || response.status === 403) {
      this.logger.error(
        `Communs a refusé la clé TeT (${response.status}) pour la fiche ${ficheId}`
      );
      return failure('COMMUNS_ACCES_REFUSE');
    }
    if (!response.ok) {
      this.logger.warn(
        `Communs a répondu ${response.status} pour la fiche ${ficheId}`
      );
      return failure('COMMUNS_INJOIGNABLE');
    }

    let reponseBrute: unknown;
    try {
      reponseBrute = await response.json();
    } catch (error) {
      return failure('COMMUNS_REPONSE_INATTENDUE', error as Error);
    }
    const parsed = reponseSecteursCommunsSchema.safeParse(reponseBrute);
    if (!parsed.success) {
      this.logger.warn(
        `Réponse inattendue de Communs pour la fiche ${ficheId} : ${parsed.error.message}`
      );
      return failure('COMMUNS_REPONSE_INATTENDUE');
    }

    return success({ statut: 'trouvee', reponse: parsed.data, reponseBrute });
  }
}
