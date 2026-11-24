export type MondrianRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MeasureMondrianText = (
  text: string,
  fontSize: number,
  fontWeight: 400 | 600
) => number;

export const MONDRIAN_LABEL_PADDING = 6;
export const MONDRIAN_LABEL_GAP = 4;
export const MONDRIAN_REFERENCE_SIZE = 24;

export const getMondrianLevierKey = (secteur: string, levier: string) =>
  JSON.stringify([secteur, levier]);

/** Conserve le libellé et la valeur entiers, sans descendre sous 12 px. */
export function fitMondrianLabel(
  label: string,
  value: string,
  rect: Pick<MondrianRect, 'width' | 'height'>,
  measure: MeasureMondrianText
) {
  const width = rect.width - 2 * MONDRIAN_LABEL_PADDING;
  const height = rect.height - 2 * MONDRIAN_LABEL_PADDING;
  const words = label.trim().split(/\s+/);

  for (let labelSize = 16; labelSize >= 12; labelSize--) {
    const valueSize = Math.max(12, labelSize - 2);
    if (measure(value, valueSize, 400) > width) continue;
    if (words.some((word) => measure(word, labelSize, 600) > width)) continue;

    const lines: string[] = [];
    for (const word of words) {
      const last = lines.at(-1);
      if (last && measure(`${last} ${word}`, labelSize, 600) <= width) {
        lines[lines.length - 1] = `${last} ${word}`;
      } else {
        lines.push(word);
      }
    }

    const labelLineHeight = Math.ceil(labelSize * 1.25);
    const valueLineHeight = Math.ceil(valueSize * 1.25);
    if (
      lines.length * labelLineHeight + MONDRIAN_LABEL_GAP + valueLineHeight <=
      height
    ) {
      return { lines, labelSize, valueSize, labelLineHeight, valueLineHeight };
    }
  }

  return null;
}

/** Répartit les repères hors des tuiles trop petites, sans chevauchement. */
export function placeMondrianReferences<T extends { rect: MondrianRect }>(
  items: T[],
  width: number
) {
  const spacing = MONDRIAN_REFERENCE_SIZE + 12;
  const columns = Math.max(1, Math.floor(width / spacing));
  const sorted = [...items].sort(
    (a, b) => a.rect.x + a.rect.width / 2 - b.rect.x - b.rect.width / 2
  );

  return sorted
    .map((item, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const rowLength = Math.min(columns, sorted.length - row * columns);
      const idealX = item.rect.x + item.rect.width / 2;
      const minX = spacing / 2 + column * spacing;
      const maxX = width - spacing / 2 - (rowLength - column - 1) * spacing;
      // Le placement précédent est pris en compte par le passage final ci-dessous.
      return { ...item, x: Math.min(maxX, Math.max(minX, idealX)), row };
    })
    .reduce<Array<T & { x: number; row: number }>>((placed, item) => {
      const previous = placed.at(-1);
      placed.push({
        ...item,
        x:
          previous?.row === item.row
            ? Math.max(item.x, previous.x + spacing)
            : item.x,
      });
      return placed;
    }, []);
}
