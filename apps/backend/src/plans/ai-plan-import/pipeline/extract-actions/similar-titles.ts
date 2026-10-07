// Deux titres reformulés gardent l'essentiel de leurs mots : « motorisations
// alternatives » et « motorisations propres » désignent la même action.
const TITLE_SIMILARITY_THRESHOLD = 0.6;
const STOP_WORDS = new Set(
  'le la les l de des du d et en a au aux pour sur un une dans par avec entre ses son sa leur leurs'.split(
    ' '
  )
);

/** Même titre à la numérotation, à la casse, aux accents et à la reformulation près. */
export const titlesMatch = (a: string, b: string): boolean => {
  const left = titleWords(a);
  const right = titleWords(b);
  if (left.size === 0 || right.size === 0) {
    return false;
  }
  const common = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;
  return common / union >= TITLE_SIMILARITY_THRESHOLD;
};

const titleWords = (title: string): Set<string> =>
  new Set(
    title
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      // « Axe 2 : », « IV. », « 1.2.3 » : la numérotation n'est pas le titre.
      .replace(/^\s*(?:axe\s*)?(?:[ivx]+|\d+(?:\.\d+)*)\b\s*[:.)\-–—]?\s*/u, '')
      // « éco-rénover » et « écorénover » : un seul mot.
      .replace(/(\p{L})[-‐‑](\p{L})/gu, '$1$2')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
  );
