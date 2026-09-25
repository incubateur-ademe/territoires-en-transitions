import { DocumentUnit } from './document-unit';

/**
 * Le texte d'une unité tel que le modèle le lit : un en-tête qui la situe,
 * et un repère `[page N]` à chaque changement de page.
 */
export const renderUnit = (
  unit: DocumentUnit,
  { index, count }: { index: number; count: number }
): string => {
  const pages =
    unit.pageStart === unit.pageEnd
      ? `page ${unit.pageStart + 1}`
      : `pages ${unit.pageStart + 1}–${unit.pageEnd + 1}`;
  const path =
    unit.headingPath.length > 0 ? ` · ${unit.headingPath.join(' > ')}` : '';
  const header = `[Extrait ${index + 1}/${count} · ${pages}${path}]`;

  const body: string[] = [];
  let currentPage: number | null = null;
  for (const line of unit.lines) {
    if (currentPage !== null && line.pageIndex !== currentPage) {
      body.push(`[page ${line.pageIndex + 1}]`);
    }
    currentPage = line.pageIndex;
    body.push(line.text);
  }
  return `${header}\n${body.join('\n')}`;
};

export const describeUnitPosition = (
  unit: DocumentUnit,
  { index, count }: { index: number; count: number }
): string =>
  `extrait ${index + 1} sur ${count}, pages ${unit.pageStart + 1} à ${
    unit.pageEnd + 1
  }`;
