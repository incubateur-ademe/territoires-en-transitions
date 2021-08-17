const stringToNumberArray = (stringIndexes: string) =>
  stringIndexes
    .split(/[^a-zA-Z0-9']/)
    .map(char => (/^-?\d+$/.test(char) ? Number(char) : char.charCodeAt(0)));

export const compareIndexes = (indexA: string, indexB: string): 0 | 1 | -1 => {
  const indexA_array = stringToNumberArray(indexA);
  const indexB_array = stringToNumberArray(indexB);
  if (indexA_array === indexB_array) return 0;

  for (
    let index = 0;
    index < Math.max(indexA_array.length, indexB_array.length);
    index++
  ) {
    const ficheAIndex = indexA_array[index];
    const ficheBIndex = indexB_array[index];
    if (ficheBIndex === undefined) return 1; // fiche A is parent of fiche B
    if (ficheAIndex === undefined) return -1; // fiche B is parent of fiche A
    if (ficheAIndex !== ficheBIndex) return ficheAIndex > ficheBIndex ? 1 : -1; // siblings comparison
  }
  return 0;
};
