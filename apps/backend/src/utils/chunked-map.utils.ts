export async function chunkedMap<TIn, TOut>({
  items,
  chunkSize,
  fn,
}: {
  items: readonly TIn[];
  chunkSize: number;
  fn: (item: TIn) => Promise<TOut>;
}): Promise<TOut[]> {
  const results: TOut[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}
