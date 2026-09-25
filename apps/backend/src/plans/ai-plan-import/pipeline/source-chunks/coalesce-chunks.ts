import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { SourceChunks } from './source-chunks';

/**
 * Regroupe des tranches adjacentes en fenêtres d'au plus `maxTokens` : les
 * étapes de vérification n'ont pas besoin de la finesse d'une fiche, et un
 * appel par fiche coûterait cent appels de plus.
 */
export const coalesceChunks = (
  source: SourceChunks,
  maxTokens: number
): SourceChunks => {
  const groups: number[][] = [];
  let current: number[] = [];
  let tokens = 0;
  source.chunks.forEach((chunk, index) => {
    const chunkTokens = estimateTokenCount(chunk);
    if (current.length > 0 && tokens + chunkTokens > maxTokens) {
      groups.push(current);
      current = [];
      tokens = 0;
    }
    current.push(index);
    tokens += chunkTokens;
  });
  if (current.length > 0) {
    groups.push(current);
  }

  const groupOfChunk = new Map(
    groups.flatMap((group, groupIndex) =>
      group.map((chunkIndex) => [chunkIndex, groupIndex] as const)
    )
  );
  return {
    chunks: groups.map((group) =>
      group.map((chunkIndex) => source.chunks[chunkIndex]).join('\n\n')
    ),
    chunkIndexByAction: source.chunkIndexByAction.map(
      (chunkIndex) => groupOfChunk.get(chunkIndex) ?? 0
    ),
  };
};
