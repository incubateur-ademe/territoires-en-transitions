import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ReponseSecteursCommuns,
  reponseSecteursCommunsSchema,
} from '@tet/domain/plans';
import { getErrorMessage } from '@tet/domain/utils';
import { z } from 'zod';

const TIMEOUT_MS = 10_000;

export type SecteursCommunsLookup =
  | {
      statut: 'trouvee';
      reponse: ReponseSecteursCommuns;
      reponseBrute: unknown;
    }
  | { statut: 'inconnue' };

const actionCommunsSchema = z
  .object({
    classificationScores: z.record(z.string(), z.unknown()).nullish(),
  })
  .nullable();

export type ActionCommunsLookup = { classee: boolean };

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
    const fetched = await this.fetchCommuns(
      `/tet/v1/actions/${ficheId}/secteurs`,
      ficheId
    );
    if (!fetched.success) {
      return fetched;
    }
    if (fetched.data === null) {
      return success({ statut: 'inconnue' });
    }

    const reponseBrute = fetched.data;
    const parsed = reponseSecteursCommunsSchema.safeParse(reponseBrute);
    if (!parsed.success) {
      this.logger.warn(
        `Réponse inattendue de Communs pour la fiche ${ficheId} : ${parsed.error.message}`
      );
      return failure('COMMUNS_REPONSE_INATTENDUE');
    }

    return success({ statut: 'trouvee', reponse: parsed.data, reponseBrute });
  }

  async getAction(
    ficheId: number
  ): Promise<Result<ActionCommunsLookup, CommunsSecteursClientError>> {
    const fetched = await this.fetchCommuns(
      `/tet/v1/actions/${ficheId}`,
      ficheId
    );
    if (!fetched.success) {
      return fetched;
    }

    const parsed = actionCommunsSchema.safeParse(fetched.data);
    if (!parsed.success) {
      this.logger.warn(
        `Réponse inattendue de Communs pour l'action ${ficheId} : ${parsed.error.message}`
      );
      return failure('COMMUNS_REPONSE_INATTENDUE');
    }

    const scores = parsed.data?.classificationScores;
    return success({ classee: Boolean(scores && Object.keys(scores).length) });
  }

  private async fetchCommuns(
    path: string,
    ficheId: number
  ): Promise<Result<unknown | null, CommunsSecteursClientError>> {
    const baseUrl = this.configurationService.get('COMMUNS_API_URL');
    const apiKey = this.configurationService.get('COMMUNS_API_KEY');
    if (!baseUrl || !apiKey) {
      return failure('COMMUNS_NON_CONFIGURE');
    }

    let response: Response;
    try {
      response = await fetch(new URL(path, baseUrl), {
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
      return success(null);
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

    try {
      return success(await response.json());
    } catch (error) {
      return failure('COMMUNS_REPONSE_INATTENDUE', error as Error);
    }
  }
}
