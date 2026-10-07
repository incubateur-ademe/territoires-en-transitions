import {
  estimateCharCount,
  estimateTokenCount,
} from '@tet/backend/utils/llm/estimate-token-count';

export type SplitDocumentOptions = {
  maxTokens: number;
  /** Fin de la tranche précédente reprise en tête de la suivante. */
  overlapTokens: number;
  /** Ligne répétée en tête de chaque tranche (en-tête d'un tableau). */
  header?: string;
};

/**
 * Découpe un texte trop long pour un seul appel en tranches coupées entre deux
 * lignes. Le chevauchement évite de couper une action sans qu'aucune tranche
 * ne la contienne en entier ; les doublons qu'il crée sont fusionnés à
 * l'extraction.
 */
export const splitDocument = (
  text: string,
  { maxTokens, overlapTokens, header }: SplitDocumentOptions
): string[] => {
  if (estimateTokenCount(text) <= maxTokens) {
    return [text];
  }

  const maxChars = estimateCharCount(maxTokens);
  // Un en-tête trop large ne laisserait plus de place au contenu : il reste
  // alors une ligne comme les autres, dans la première tranche seulement.
  const repeatedHeader =
    header && header.length + 1 <= maxChars / 2 ? header : undefined;
  const prefix = repeatedHeader ? `${repeatedHeader}\n` : '';
  // Le préfixe et la reprise ne doivent pas manger toute la tranche.
  const overlapChars = Math.min(
    estimateCharCount(overlapTokens),
    Math.floor((maxChars - prefix.length) / 4)
  );
  const bodyChars = maxChars - prefix.length - overlapChars;
  // L'en-tête est la première ligne du texte : il revient par le préfixe.
  const lines = text
    .split('\n')
    .slice(repeatedHeader ? 1 : 0)
    .flatMap((line) => splitLongLine(line, bodyChars));

  const chunks: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;
  for (const line of lines) {
    if (current.length > 0 && currentChars + line.length + 1 > bodyChars) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(line);
    currentChars += line.length + 1;
  }
  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks.map((chunkLines, index) => {
    const overlap =
      index === 0 ? [] : tailLines(chunks[index - 1], overlapChars);
    return prefix + [...overlap, ...chunkLines].join('\n');
  });
};

const splitLongLine = (line: string, maxChars: number): string[] => {
  if (line.length <= maxChars) {
    return [line];
  }
  const parts: string[] = [];
  for (let start = 0; start < line.length; start += maxChars) {
    parts.push(line.slice(start, start + maxChars));
  }
  return parts;
};

const tailLines = (lines: string[], maxChars: number): string[] => {
  const tail: string[] = [];
  let chars = 0;
  for (let index = lines.length - 1; index >= 0; index--) {
    chars += lines[index].length + 1;
    if (chars > maxChars) {
      break;
    }
    tail.unshift(lines[index]);
  }
  return tail;
};
