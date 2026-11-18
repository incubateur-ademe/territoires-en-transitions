import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { REPO_FULL_NAME } from '../../resources/carte-du-depot.doc';

export type GithubRepoError =
  | 'GITHUB_NOT_CONFIGURED'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_API_ERROR'
  | 'FILE_NOT_FOUND';

export type GithubCodeMatch = { path: string; fragments: string[] };

const API_URL = 'https://api.github.com';
/** La recherche de code GitHub n'indexe que la branche par défaut. */
const REPO_REF = 'main';
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_ENTRIES = 200;
/** Au-delà, GitHub ne sert plus le contenu brut par cette route. */
const MAX_FILE_BYTES = 1_000_000;

type CacheEntry<T> = { loadedAt: number; value: T };

/**
 * Lecture seule du dépôt public sur l'API REST GitHub. Sans jeton, l'arbre et
 * les fichiers restent lisibles (quota anonyme par IP) ; la recherche de code
 * exige `GITHUB_API_TOKEN` et son quota (10 requêtes par minute) est partagé
 * par tous les utilisateurs, d'où le cache.
 */
@Injectable()
export class GithubRepoClient {
  private readonly logger = new Logger(GithubRepoClient.name);
  private tree?: CacheEntry<string[]>;
  private readonly files = new Map<string, CacheEntry<string>>();
  private readonly searches = new Map<
    string,
    CacheEntry<{ total: number; matches: GithubCodeMatch[] }>
  >();

  constructor(private readonly configService: ConfigurationService) {}

  canSearch(): boolean {
    return Boolean(this.configService.get('GITHUB_API_TOKEN'));
  }

  /** Chemins de tous les fichiers du dépôt. */
  async listPaths(): Promise<Result<string[], GithubRepoError>> {
    if (this.tree && isFresh(this.tree)) {
      return success(this.tree.value);
    }
    const response = await this.request(
      `/repos/${REPO_FULL_NAME}/git/trees/${REPO_REF}?recursive=1`,
      'application/vnd.github+json'
    );
    if (!response.success) {
      return response;
    }
    const body = (await response.data.json()) as {
      tree?: { path: string; type: string }[];
    };
    const paths = (body.tree ?? [])
      .filter((entry) => entry.type === 'blob')
      .map((entry) => entry.path);
    this.tree = { loadedAt: Date.now(), value: paths };
    return success(paths);
  }

  async readFile(path: string): Promise<Result<string, GithubRepoError>> {
    const cached = this.files.get(path);
    if (cached && isFresh(cached)) {
      return success(cached.value);
    }
    const response = await this.request(
      `/repos/${REPO_FULL_NAME}/contents/${path
        .split('/')
        .map(encodeURIComponent)
        .join('/')}?ref=${REPO_REF}`,
      'application/vnd.github.raw+json'
    );
    if (!response.success) {
      return response;
    }
    const text = await response.data.text();
    if (text.length > MAX_FILE_BYTES) {
      return failure('GITHUB_API_ERROR', new Error('Fichier trop volumineux'));
    }
    remember(this.files, path, text);
    return success(text);
  }

  async searchCode(
    query: string,
    limit: number
  ): Promise<
    Result<{ total: number; matches: GithubCodeMatch[] }, GithubRepoError>
  > {
    if (!this.canSearch()) {
      return failure('GITHUB_NOT_CONFIGURED');
    }
    const cached = this.searches.get(query);
    if (cached && isFresh(cached)) {
      return success(cached.value);
    }
    const response = await this.request(
      `/search/code?q=${encodeURIComponent(query)}&per_page=${limit}`,
      'application/vnd.github.text-match+json'
    );
    if (!response.success) {
      return response;
    }
    const body = (await response.data.json()) as {
      total_count?: number;
      items?: { path: string; text_matches?: { fragment?: string }[] }[];
    };
    const value = {
      total: body.total_count ?? 0,
      matches: (body.items ?? []).map((item) => ({
        path: item.path,
        fragments: (item.text_matches ?? [])
          .map((match) => match.fragment ?? '')
          .filter(Boolean),
      })),
    };
    remember(this.searches, query, value);
    return success(value);
  }

  private async request(
    path: string,
    accept: string
  ): Promise<Result<Response, GithubRepoError>> {
    const token = this.configService.get('GITHUB_API_TOKEN');
    try {
      const response = await fetch(`${API_URL}${path}`, {
        headers: {
          Accept: accept,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'territoires-en-transitions-backend',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) {
        return success(response);
      }
      if (response.status === 404) {
        return failure('FILE_NOT_FOUND');
      }
      const rateLimited =
        response.status === 429 ||
        (response.status === 403 &&
          response.headers.get('x-ratelimit-remaining') === '0');
      if (rateLimited) {
        const reset = Number(response.headers.get('x-ratelimit-reset'));
        const seconds = Number.isFinite(reset)
          ? Math.max(1, Math.ceil(reset - Date.now() / 1000))
          : 60;
        return failure(
          'GITHUB_RATE_LIMITED',
          new Error(`Quota GitHub atteint, réessayer dans ${seconds} s`)
        );
      }
      this.logger.warn(`GitHub ${response.status} sur ${path}`);
      return failure(
        'GITHUB_API_ERROR',
        new Error(`GitHub a répondu ${response.status}`)
      );
    } catch (error) {
      this.logger.warn(`GitHub injoignable sur ${path} : ${String(error)}`);
      return failure(
        'GITHUB_API_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

const isFresh = (entry: CacheEntry<unknown>): boolean =>
  Date.now() - entry.loadedAt < CACHE_TTL_MS;

const remember = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T
): void => {
  if (cache.size >= MAX_CACHED_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, { loadedAt: Date.now(), value });
};
