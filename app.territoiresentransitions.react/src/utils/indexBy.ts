/* Indexe un tableau d'objets par le contenu d'une des clés de chaque item */
export function indexBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
) {
  type Result = Record<string, T>;
  const result: Result = {} as Result;
  array.forEach(item => {
    const indexKey = item[key] as string;
    result[indexKey] = item;
  });
  return result;
}
