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

export type GithubCodeSearch = {
  total: number;
  matches: GithubCodeMatch[];
  /** GitHub a coupé la recherche avant la fin : l'absence de résultat ne prouve rien. */
  incomplete: boolean;
};

export type GithubRepoTree = {
  paths: string[];
  /** GitHub n'a rendu qu'une partie de l'arbre : un chemin absent peut exister. */
  truncated: boolean;
};

const API_URL = 'https://api.github.com';
/** La recherche de code GitHub n'indexe que la branche par défaut. */
const REPO_REF = 'main';
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_ENTRIES = 200;
/** Au-delà, le fichier n'est ni lu en entier ni gardé en cache. */
const MAX_FILE_BYTES = 1_000_000;
/** Attente conseillée par GitHub quand il ne donne aucun délai. */
const DEFAULT_RETRY_SECONDS = 60;

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
  private tree?: CacheEntry<GithubRepoTree>;
  private readonly files = new Map<string, CacheEntry<string>>();
  private readonly searches = new Map<string, CacheEntry<GithubCodeSearch>>();

  constructor(private readonly configService: ConfigurationService) {}

  canSearch(): boolean {
    return Boolean(this.configService.get('GITHUB_API_TOKEN'));
  }

  /** Chemins de tous les fichiers du dépôt. */
  async listPaths(): Promise<Result<GithubRepoTree, GithubRepoError>> {
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
      truncated?: boolean;
    };
    const value = {
      paths: (body.tree ?? [])
        .filter((entry) => entry.type === 'blob')
        .map((entry) => entry.path),
      truncated: body.truncated === true,
    };
    // Un arbre partiel n'est pas gardé : il ferait passer dix minutes durant
    // des dossiers existants pour absents.
    if (value.truncated) {
      this.logger.warn(
        'Arbre du dépôt tronqué par GitHub : inventaire partiel'
      );
    } else {
      this.tree = { loadedAt: Date.now(), value };
    }
    return success(value);
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
    const text = await readBoundedText(response.data, MAX_FILE_BYTES);
    if (text === null) {
      return failure('GITHUB_API_ERROR', new Error('Fichier trop volumineux'));
    }
    remember(this.files, path, text);
    return success(text);
  }

  async searchCode(
    query: string,
    limit: number
  ): Promise<Result<GithubCodeSearch, GithubRepoError>> {
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
      incomplete_results?: boolean;
      items?: { path: string; text_matches?: { fragment?: string }[] }[];
    };
    const value = {
      total: body.total_count ?? 0,
      incomplete: body.incomplete_results === true,
      matches: (body.items ?? []).map((item) => ({
        path: item.path,
        fragments: (item.text_matches ?? [])
          .map((match) => match.fragment ?? '')
          .filter(Boolean),
      })),
    };
    // Une recherche interrompue est rejouée au prochain appel.
    if (!value.incomplete) {
      remember(this.searches, query, value);
    }
    return success(value);
  }

  private async request(
    path: string,
    accept: string
  ): Promise<Result<Response, GithubRepoError>> {
    const token = this.configService.get('GITHUB_API_TOKEN');
    // Sans la chaîne de requête : elle porte les termes cherchés par l'utilisateur.
    const loggedPath = path.split('?')[0];
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
      // Le corps d'une réponse en échec n'est pas lu : le libérer rend la connexion.
      await response.body?.cancel().catch(() => undefined);
      if (response.status === 404) {
        return failure('FILE_NOT_FOUND');
      }
      const seconds = retryDelaySeconds(response.status, response.headers);
      if (seconds !== null) {
        return failure(
          'GITHUB_RATE_LIMITED',
          new Error(`Quota GitHub atteint, réessayer dans ${seconds} s`)
        );
      }
      this.logger.warn(`GitHub ${response.status} sur ${loggedPath}`);
      return failure(
        'GITHUB_API_ERROR',
        new Error(`GitHub a répondu ${response.status}`)
      );
    } catch (error) {
      this.logger.warn(
        `GitHub injoignable sur ${loggedPath} : ${
          error instanceof Error ? error.name : 'erreur inconnue'
        }`
      );
      return failure(
        'GITHUB_API_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

/**
 * Délai avant de réessayer, ou `null` si la réponse n'est pas une limite de
 * débit. Ordre de la documentation GitHub : `Retry-After`, puis
 * `x-ratelimit-reset` quand le quota est à zéro, sinon une minute. Un 403
 * sans aucun des deux reste une erreur d'autorisation.
 */
export const retryDelaySeconds = (
  status: number,
  headers: Pick<Headers, 'get'>,
  now = Date.now()
): number | null => {
  const retryAfter = headers.get('retry-after');
  const exhausted = headers.get('x-ratelimit-remaining') === '0';
  if (
    status !== 429 &&
    !(status === 403 && (retryAfter !== null || exhausted))
  ) {
    return null;
  }
  const afterSeconds = Number(retryAfter);
  if (
    retryAfter !== null &&
    Number.isFinite(afterSeconds) &&
    afterSeconds > 0
  ) {
    return Math.ceil(afterSeconds);
  }
  const reset = Number(headers.get('x-ratelimit-reset'));
  if (exhausted && Number.isFinite(reset) && reset > 0) {
    return Math.max(1, Math.ceil(reset - now / 1000));
  }
  return DEFAULT_RETRY_SECONDS;
};

/**
 * Texte du corps, ou `null` dès que le flux dépasse `maxBytes` : la lecture
 * est alors abandonnée sans charger le reste.
 */
export const readBoundedText = async (
  response: Pick<Response, 'body'>,
  maxBytes: number
): Promise<string | null> => {
  if (!response.body) {
    return '';
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return text + decoder.decode();
    }
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
};

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
