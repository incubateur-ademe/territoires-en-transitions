/* Indexe par le contenu d'une des clés de chaque item et regroupe en sous-tableaux un tableau d'objets */
export const groupBy = <T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
) => {
  type Result = Record<typeof key, T[]>;
  const result: Result = {} as Result;
  array.forEach((item) => {
    const indexKey = item[key] as typeof key;
    if (result[indexKey]) {
      result[indexKey].push(item);
    } else {
      result[indexKey] = [item];
    }
  });
  return result;
};
