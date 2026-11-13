/** Un passage reconnu dans le texte d'origine : `[début, fin[`. */
export type SearchTextRange = readonly [start: number, end: number];

export type SearchTextMatch = {
  /** Plus il est haut, plus le texte répond à la recherche. */
  score: number;
  /** Un mot au moins n'a été reconnu qu'au prix d'une faute de frappe. */
  hasTypos: boolean;
  /** Les passages reconnus, à surligner. */
  ranges: SearchTextRange[];
};

export type MatchSearchTextOptions = {
  /** Tolérer des fautes de frappe, dans la limite de `maxTyposForLength`. */
  allowTypos?: boolean;
};

/** Les diacritiques, que la décomposition NFD sépare de leur lettre. */
const COMBINING_MARKS = /\p{M}/gu;

/** Les lettres que la décomposition NFD laisse entières. */
const LIGATURES: Record<string, string> = {
  œ: 'oe',
  Œ: 'oe',
  æ: 'ae',
  Æ: 'ae',
  ß: 'ss',
};

const TEXT_START_BONUS = 0.5;

const foldChar = (char: string): string => {
  const ligature = LIGATURES[char];
  if (ligature) return ligature;
  const lower = char
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .charAt(0);
  return /[a-z0-9]/.test(lower) ? lower : ' ';
};

/**
 * Le texte replié, et pour chacun de ses caractères la position du caractère
 * d'origine : un passage reconnu se surligne aux bonnes positions, même quand
 * « œ » est devenu « oe ».
 */
const foldWithSource = (text: string): { folded: string; source: number[] } => {
  let folded = '';
  const source: number[] = [];
  text.split('').forEach((char, index) => {
    const replacement = foldChar(char);
    folded += replacement;
    source.push(...Array.from(replacement, () => index));
  });
  return { folded, source };
};

/**
 * Le texte sans accents ni casse, ligatures dépliées, la ponctuation remplacée
 * par des espaces : « Cœur-de-Savoie » devient « coeur de savoie ».
 */
export const foldSearchText = (text: string): string =>
  foldWithSource(text).folded;

/** Les mots d'une recherche, repliés. */
export const tokenizeSearchQuery = (query: string): string[] =>
  foldSearchText(query).split(' ').filter(Boolean);

/**
 * Les fautes de frappe admises pour un mot tapé de cette longueur.
 *
 * Aucune sous 5 caractères : « lyon » trouverait « lion », « metz » « mets ».
 */
export const maxTyposForLength = (length: number): number =>
  length < 5 ? 0 : length < 9 ? 1 : 2;

/**
 * Le nombre de fautes de frappe qui séparent deux mots : lettre oubliée, en
 * trop, remplacée, ou deux lettres voisines inversées.
 */
export const typoDistance = (a: string, b: string): number => {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) {
    d[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
};

type Word = { word: string; start: number };

const listWords = (folded: string): Word[] =>
  Array.from(folded.matchAll(/[a-z0-9]+/g), (m) => ({
    word: m[0],
    start: m.index ?? 0,
  }));

type TokenMatch = { score: number; range: SearchTextRange; typos: number };

const matchExactly = (token: string, words: Word[]): TokenMatch | null => {
  let best: TokenMatch | null = null;
  for (const { word, start } of words) {
    const at = word.indexOf(token);
    if (at === -1) continue;
    // Un mot qui commence par la saisie passe devant un mot qui la contient.
    const score = at === 0 ? 3 : 2;
    if (!best || score > best.score) {
      best = {
        score,
        range: [start + at, start + at + token.length],
        typos: 0,
      };
    }
  }
  return best;
};

/**
 * Le mot tapé est comparé au début de chaque mot du texte, et non au mot
 * entier : une saisie en cours (« monpel ») doit déjà trouver « Montpellier ».
 */
const matchWithTypos = (token: string, words: Word[]): TokenMatch | null => {
  const max = maxTyposForLength(token.length);
  if (max === 0) return null;
  let best: TokenMatch | null = null;
  for (const { word, start } of words) {
    const shortest = Math.max(1, token.length - max);
    const longest = Math.min(word.length, token.length + max);
    for (let length = shortest; length <= longest; length++) {
      const typos = typoDistance(token, word.slice(0, length));
      // À fautes égales dans un même mot, le passage le plus long : on
      // surligne « Héricourt » plutôt que « Héricou ».
      const isBetter =
        !best ||
        typos < best.typos ||
        (typos === best.typos && best.range[0] === start);
      if (typos <= max && isBetter) {
        best = { score: 1 - typos / 4, range: [start, start + length], typos };
      }
    }
  }
  return best;
};

/**
 * Le texte répond-il à la recherche ? `null` si non.
 *
 * Chaque mot tapé doit se retrouver dans un mot du texte : contenu tel quel, ou,
 * si `allowTypos`, au début d'un mot à quelques fautes de frappe près. Accents,
 * casse et ponctuation sont ignorés des deux côtés.
 */
export const matchSearchText = (
  query: string,
  text: string,
  { allowTypos = false }: MatchSearchTextOptions = {}
): SearchTextMatch | null => {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return null;

  const { folded, source } = foldWithSource(text);
  const words = listWords(folded);
  let score = 0;
  let hasTypos = false;
  const ranges: SearchTextRange[] = [];
  for (const token of tokens) {
    const match =
      matchExactly(token, words) ??
      (allowTypos ? matchWithTypos(token, words) : null);
    if (!match) return null;
    score += match.score;
    hasTypos ||= match.typos > 0;
    ranges.push(match.range);
  }
  // Un texte qui commence par la saisie passe devant celui qui la contient
  // plus loin : « saône » range Saône-et-Loire avant Haute-Saône.
  if (ranges.some(([start]) => start === words[0]?.start)) {
    score += TEXT_START_BONUS;
  }
  return {
    score,
    hasTypos,
    ranges: ranges.map(([start, end]) => [source[start], source[end - 1] + 1]),
  };
};
