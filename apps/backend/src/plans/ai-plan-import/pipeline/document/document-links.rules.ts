import type { DocumentLink, DocumentLocation, PageLine } from './document-page';
import type { GridCell } from '../analyze-workbook/sheet-grid';

/** Métadonnées de lecture uniquement : aucune validation métier ni requête réseau. */
export class DocumentLinksRules {
  static cellMetadata(
    cells: GridCell[],
    sheetName: string,
    pageIndex: number
  ): Pick<PageLine, 'locations' | 'links'> {
    return this.combine(
      cells
        .filter(
          (cell) =>
            !cell.isMergeSlave && (cell.text !== '' || cell.links?.length)
        )
        .map((cell) => {
          const location = {
            pageIndex,
            sheetName,
            row: cell.row,
            col: cell.col,
          };
          return {
            locations: [location],
            links: cell.links ?? this.textLinks(cell.text, location),
          };
        })
    );
  }

  static textLinks(text: string, location: DocumentLocation): DocumentLink[] {
    return [...text.matchAll(/https?:\/\/[^\s<>"']+/gi)].map(([value]) => {
      let target = value.replace(/[.,;!?]+$/, '');
      // Une parenthèse qui encadre l'URL n'en fait pas partie ; celles du chemin si.
      for (const [open, close] of [
        ['(', ')'],
        ['[', ']'],
      ]) {
        while (
          target.endsWith(close) &&
          target.split(close).length > target.split(open).length
        ) {
          target = target.slice(0, -1);
        }
      }
      return { text: target, target, kind: 'text', location };
    });
  }

  static withTextLinks(
    text: string,
    location: DocumentLocation,
    hyperlinks: DocumentLink[]
  ): DocumentLink[] {
    return [
      ...hyperlinks,
      ...this.textLinks(text, location).filter(
        (link) =>
          !hyperlinks.some(
            ({ text, target }) => text === link.text && target === link.target
          )
      ),
    ];
  }

  static combine(
    lines: Pick<PageLine, 'locations' | 'links'>[]
  ): Pick<PageLine, 'locations' | 'links'> {
    const locations = [
      ...new Set(lines.flatMap((line) => line.locations ?? [])),
    ];
    const links = [...new Set(lines.flatMap((line) => line.links ?? []))];
    return {
      ...(locations.length > 0 ? { locations } : {}),
      ...(links.length > 0 ? { links } : {}),
    };
  }
}
