/**
 * Texte source d'un import, découpé en tranches, et tranche d'où vient chaque
 * action. Les étapes après l'extraction n'envoient au modèle que la tranche
 * des actions qu'elles traitent. Les étapes conservent l'ordre et la longueur
 * de la liste des actions : l'index d'une action y reste valable.
 */
export type SourceChunks = {
  chunks: string[];
  chunkIndexByAction: number[];
};

export const wholeDocument = (
  text: string,
  actionCount: number
): SourceChunks => ({
  chunks: [text],
  chunkIndexByAction: Array.from({ length: actionCount }, () => 0),
});

export type ChunkGroup<T> = { text: string; items: T[] };

/** Regroupe des éléments par tranche de l'action à laquelle ils se rattachent. */
export const groupByChunk = <T>(
  items: T[],
  actionIndexOf: (item: T) => number,
  { chunks, chunkIndexByAction }: SourceChunks
): ChunkGroup<T>[] => {
  const itemsByChunk = new Map<number, T[]>();
  for (const item of items) {
    const chunkIndex = chunkIndexByAction[actionIndexOf(item)] ?? 0;
    itemsByChunk.set(chunkIndex, [
      ...(itemsByChunk.get(chunkIndex) ?? []),
      item,
    ]);
  }
  return [...itemsByChunk.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chunkIndex, chunkItems]) => ({
      text: chunks[chunkIndex],
      items: chunkItems,
    }));
};
