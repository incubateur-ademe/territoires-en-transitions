import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReadDocument } from '../../pipeline/document/document-page';
import { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import { ElectrificationDocumentSource } from './electrification-extraction.schema';

type Section = 'A' | 'B' | 'excluded';
type DocumentTable = {
  section: 'A' | 'B';
  rows: ElectrificationDocumentSource[][];
};

/** Sélectionne les tableaux A/B et conserve une source par cellule d'origine. */
export class ElectrificationDocumentRules {
  static read(
    document: ReadDocument
  ): Result<
    { sources: ElectrificationDocumentSource[]; tables: DocumentTable[] },
    ElectrificationIssue[]
  > {
    if (document.kind !== 'docx')
      return failure([Errors.issue('UNSUPPORTED_ELECTRIFICATION_DOCUMENT')]);
    if (!document.blocks?.length)
      return failure([Errors.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE')]);
    const tables: DocumentTable[] = [];
    const sources = new Map<string, ElectrificationDocumentSource>();
    let section: Section = 'excluded';
    for (const block of document.blocks) {
      if (block.type === 'paragraph') {
        const nextSection = this.section(block.text);
        if (
          nextSection === null &&
          section !== 'excluded' &&
          (block.text.trim() || block.links.length)
        ) {
          return failure([
            Errors.issue(
              'UNSUPPORTED_ELECTRIFICATION_STRUCTURE',
              `Section ${section}, paragraphe ${
                (block.location.lineIndex ?? 0) + 1
              }`
            ),
          ]);
        }
        section = nextSection ?? section;
        continue;
      }
      if (section === 'excluded') continue;
      const location = `Tableau ${(block.location.tableIndex ?? 0) + 1}`;
      if (
        block.unsupportedReason ||
        block.rows.length === 0 ||
        block.location.tableIndex === undefined
      )
        return failure([
          Errors.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE', location),
        ]);
      const selectedSection = section;
      const rows = block.rows.map((row) =>
        row.map((cell) => {
          const { tableIndex, row, col } = cell.location;
          const id = `t${tableIndex}:r${row}:c${col}`;
          const source: ElectrificationDocumentSource = {
            id,
            section: selectedSection,
            text: cell.text,
            location: `${location}, ligne ${row}, cellule ${col}`,
            links: cell.links,
          };
          sources.set(id, source);
          return source;
        })
      );
      tables.push({ section, rows });
    }
    return tables.some((table) => table.section === 'A')
      ? success({ sources: [...sources.values()], tables })
      : failure([Errors.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE')]);
  }

  private static section(text: string): Section | null {
    const heading = Values.normalize(text).replace(/^#{1,6}\s*/, '');
    const match = heading.match(
      /^(?:(?:section|partie|tableau)\s+)?([a-z])(?:\s*[.):–—-]\s*|\s+(?=engagement|fiche|action|exemple)|$)/
    );
    if (!match) return null;
    return match[1] === 'a' ? 'A' : match[1] === 'b' ? 'B' : 'excluded';
  }
}
