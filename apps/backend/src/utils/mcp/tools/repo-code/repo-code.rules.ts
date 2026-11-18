/** Lignes rendues par défaut et au maximum par `read_code`. */
export const DEFAULT_READ_LINES = 120;
export const MAX_READ_LINES = 200;
/** Sous la troncature des résultats d'outil de l'agent (8 000 caractères). */
export const MAX_READ_CHARS = 7_000;
/** Au-delà, `list_repo_files` ne rend que les enfants directs du dossier. */
export const MAX_LISTED_FILES = 150;
export const MAX_SEARCH_RESULTS = 10;
const MAX_FRAGMENT_CHARS = 300;

const UNREADABLE_FILE =
  /(^|\/)(\.env[^/]*|[^/]*\.keys|pnpm-lock\.yaml)$|\.(png|jpe?g|gif|webp|ico|pdf|xlsx?|docx?|pptx?|zip|gz|woff2?|ttf|otf|mp4|webm)$/i;

/**
 * Chemin relatif à la racine du dépôt, sans `./` ni barre finale ; `null` s'il
 * tente de sortir du dépôt.
 */
export const normalizeRepoPath = (path: string): string | null => {
  const cleaned = path
    .trim()
    .replace(/^\.?\/+/, '')
    .replace(/\/+$/, '');
  return cleaned.split('/').some((part) => part === '..') ? null : cleaned;
};

/** Fichiers d'environnement, lockfile et binaires : rien à y lire. */
export const isReadableFile = (path: string): boolean =>
  !UNREADABLE_FILE.test(path);

export const isUnder = (path: string, folder: string): boolean =>
  folder === '' || path === folder || path.startsWith(`${folder}/`);

export type RepoListing = {
  dossier: string;
  totalFichiers: number;
  /** Tous les fichiers si le dossier est petit, sinon ses enfants directs. */
  fichiers: string[];
  sousDossiers: { chemin: string; fichiers: number }[];
  /** Présent quand la liste est coupée ou l'inventaire incomplet. */
  partiel?: string;
};

const PARTIAL_LISTING = `Liste limitée aux ${MAX_LISTED_FILES} premiers chemins : préciser le filtre ou lister un sous-dossier pour voir la suite.`;

const capListing = (
  paths: string[]
): Pick<RepoListing, 'fichiers' | 'partiel'> =>
  paths.length > MAX_LISTED_FILES
    ? { fichiers: paths.slice(0, MAX_LISTED_FILES), partiel: PARTIAL_LISTING }
    : { fichiers: paths };

/**
 * Contenu d'un dossier à partir de la liste des fichiers du dépôt. Avec un
 * `filtre`, cherche ce texte dans les chemins de tout le sous-arbre.
 */
export const listRepoFolder = (
  allPaths: readonly string[],
  folder: string,
  filter?: string
): RepoListing => {
  const inFolder = allPaths.filter(
    (path) => isUnder(path, folder) && path !== folder && isReadableFile(path)
  );
  if (filter) {
    const needle = filter.toLowerCase();
    const matches = inFolder.filter((path) =>
      path.toLowerCase().includes(needle)
    );
    return {
      dossier: folder,
      totalFichiers: matches.length,
      ...capListing(matches),
      sousDossiers: [],
    };
  }
  if (inFolder.length <= MAX_LISTED_FILES) {
    return {
      dossier: folder,
      totalFichiers: inFolder.length,
      fichiers: inFolder,
      sousDossiers: [],
    };
  }
  const prefixLength = folder === '' ? 0 : folder.length + 1;
  const directFiles: string[] = [];
  const subFolders = new Map<string, number>();
  for (const path of inFolder) {
    const [first, ...rest] = path.slice(prefixLength).split('/');
    if (rest.length === 0) {
      directFiles.push(path);
    } else {
      const subFolder = folder === '' ? first : `${folder}/${first}`;
      subFolders.set(subFolder, (subFolders.get(subFolder) ?? 0) + 1);
    }
  }
  return {
    dossier: folder,
    totalFichiers: inFolder.length,
    ...capListing(directFiles),
    sousDossiers: [...subFolders].map(([chemin, fichiers]) => ({
      chemin,
      fichiers,
    })),
  };
};

export type CodeExcerpt = {
  debut: number;
  fin: number;
  totalLignes: number;
  /** Lignes préfixées de leur numéro. */
  contenu: string;
};

/** Extrait numéroté, borné en lignes et en caractères. */
export const sliceCode = (
  text: string,
  start = 1,
  lineCount = DEFAULT_READ_LINES
): CodeExcerpt => {
  const lines = text.split('\n');
  const first = Math.min(Math.max(start, 1), Math.max(lines.length, 1));
  const numbered: string[] = [];
  let chars = 0;
  for (
    let index = first - 1;
    index < lines.length &&
    numbered.length < Math.min(lineCount, MAX_READ_LINES);
    index++
  ) {
    const line = `${index + 1}\t${lines[index]}`;
    if (numbered.length > 0 && chars + line.length > MAX_READ_CHARS) {
      break;
    }
    numbered.push(line.slice(0, MAX_READ_CHARS));
    chars += line.length + 1;
  }
  return {
    debut: first,
    fin: first + numbered.length - 1,
    totalLignes: lines.length,
    contenu: numbered.join('\n'),
  };
};

/** Requête de l'API de recherche de code GitHub, bornée au dépôt. */
export const buildCodeSearchQuery = (
  terms: string,
  repo: string,
  folder?: string
): string =>
  [
    // Les qualificatifs sont posés par le serveur : ceux du modèle sont
    // neutralisés, sauf dans un texte entre guillemets, cherché tel quel.
    terms
      .split(/("[^"]*")/)
      .map((part) =>
        part.startsWith('"')
          ? part
          : part.replace(
              /\b(repo|org|user|path|filename|extension|language):/gi,
              '$1 '
            )
      )
      .join(''),
    `repo:${repo}`,
    ...(folder ? [`path:${folder}`] : []),
  ].join(' ');

export const shortenFragment = (fragment: string): string =>
  fragment.length > MAX_FRAGMENT_CHARS
    ? `${fragment.slice(0, MAX_FRAGMENT_CHARS)}…`
    : fragment;
