import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';

export type HogqlQueryResponse = {
  columns: string[];
  results: unknown[][];
  hasMore: boolean;
};

export type PosthogQueryError =
  | 'POSTHOG_NOT_CONFIGURED'
  | 'POSTHOG_QUERY_ERROR';

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_ERROR_LENGTH = 1000;

/** Lecture de l'API « query » de PostHog (HogQL). */
@Injectable()
export class PosthogQueryClient {
  private readonly logger = new Logger(PosthogQueryClient.name);

  constructor(private readonly configService: ConfigurationService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get('POSTHOG_PERSONAL_API_KEY'));
  }

  async run(
    hogql: string
  ): Promise<Result<HogqlQueryResponse, PosthogQueryError>> {
    const apiKey = this.configService.get('POSTHOG_PERSONAL_API_KEY');
    if (!apiKey) {
      return failure('POSTHOG_NOT_CONFIGURED');
    }
    const host = this.configService.get('POSTHOG_API_HOST').replace(/\/+$/, '');
    const projectId = this.configService.get('POSTHOG_PROJECT_ID');

    let response: Response;
    let body: string;
    try {
      response = await fetch(`${host}/api/projects/${projectId}/query/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // Le délai court encore pendant la lecture du corps.
      body = await response.text();
    } catch (error) {
      this.logger.warn(`PostHog query failed: ${(error as Error).message}`);
      return failure('POSTHOG_QUERY_ERROR', error as Error);
    }

    if (!response.ok) {
      return failure(
        'POSTHOG_QUERY_ERROR',
        new Error(
          `PostHog HTTP ${response.status} : ${extractErrorDetail(body)}`
        )
      );
    }

    let json: Partial<HogqlQueryResponse> | null;
    try {
      json = JSON.parse(body);
    } catch {
      return failure(
        'POSTHOG_QUERY_ERROR',
        new Error('Réponse PostHog illisible (JSON invalide)')
      );
    }
    if (!json || !Array.isArray(json.results)) {
      return failure(
        'POSTHOG_QUERY_ERROR',
        new Error(
          `Réponse PostHog sans résultats : ${extractErrorDetail(body)}`
        )
      );
    }

    return success({
      columns: Array.isArray(json.columns) ? json.columns.map(String) : [],
      results: json.results,
      hasMore: Boolean(json.hasMore),
    });
  }
}

function extractErrorDetail(body: string): string {
  let detail = body;
  try {
    const json = JSON.parse(body) as { detail?: unknown; error?: unknown };
    const candidate = json.detail ?? json.error;
    if (candidate !== undefined) {
      detail =
        typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
    }
  } catch {
    // corps non JSON : on garde le texte brut
  }
  return detail.slice(0, MAX_ERROR_LENGTH);
}
