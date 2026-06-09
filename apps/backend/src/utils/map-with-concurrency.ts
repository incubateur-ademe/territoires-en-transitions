// Fenêtre glissante : `concurrency` workers tirent l'élément suivant dès qu'ils
// se libèrent, plutôt que d'attendre la fin d'un lot complet (où un fichier lent
// bloque tout le lot). Les résultats sont rendus dans l'ordre des `items`.
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  task: (item: T) => Promise<R>,
  onSettled?: (completedCount: number) => void
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let completedCount = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index]);
      completedCount += 1;
      onSettled?.(completedCount);
    }
  }

  const workerCount = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
}
