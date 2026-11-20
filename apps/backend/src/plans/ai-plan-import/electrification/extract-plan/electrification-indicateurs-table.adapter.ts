import {
  electrificationDocumentFormats,
  ElectrificationIndicateursTableFormat,
} from '@tet/backend/plans/plans/electrification/config/electrification-document-formats.config';
import { electrificationIndicateursDocument } from '@tet/backend/plans/plans/electrification/config/electrification-indicateurs-document.config';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationDocumentSource as Source } from './electrification-extraction.schema';
import { ElectrificationIndicateurCells } from './electrification-indicateur-cells.types';

/** Adapte la grille Word d'un format reconnu vers les cellules du lecteur commun. */
export class ElectrificationIndicateursTableAdapter {
  private constructor(
    private readonly format: ElectrificationIndicateursTableFormat,
    private readonly indices: number[],
    private readonly width: number
  ) {}

  static fromHeader(
    row: Source[]
  ): ElectrificationIndicateursTableAdapter | null {
    const cells = row.flatMap((cell, index) =>
      row.findIndex((item) => item.id === cell.id) === index
        ? [{ cell, index }]
        : []
    );
    const matches = Object.values(electrificationDocumentFormats).filter(
      ({ indicateurs }) =>
        indicateurs.columns.length === cells.length &&
        cells.every(
          ({ cell }, index) =>
            Values.normalize(cell.text) ===
            Values.normalize(indicateurs.columns[index].label)
        )
    );
    // Ne pas choisir arbitrairement un format inconnu ou ambigu.
    if (matches.length !== 1) return null;
    return new ElectrificationIndicateursTableAdapter(
      matches[0].indicateurs,
      cells.map(({ index }) => index),
      row.length
    );
  }

  read(
    row: Source[],
    actionLocation: string,
    indicatorIndex: number
  ): ElectrificationIndicateurCells | null {
    const cells = this.readCells(row);
    if (!cells) return null;
    const { fields } = electrificationIndicateursDocument;
    const location = Locations.field(
      actionLocation,
      Locations.entity(
        'Indicateur',
        Values.text(cells.titre, fields.titre.placeholder) ||
          cells.reference.text.trim(),
        `n°${indicatorIndex}`
      )
    );
    for (const { field, label } of this.format.columns) {
      const cell = cells[field];
      if (cell)
        cells[field] = { ...cell, location: Locations.field(location, label) };
    }
    return cells;
  }

  private readCells(row: Source[]): ElectrificationIndicateurCells | null {
    if (row.length !== this.width) return null;
    const selected = this.indices.map((index) => row[index]);
    if (selected.some((cell) => !cell)) return null;
    const fields: Partial<ElectrificationIndicateurCells> = {};
    this.format.columns.forEach(({ field }, index) => {
      fields[field] = selected[index];
    });
    const { reference, titre, resultat, objectif, objectifComplementaire } =
      fields;
    if (!reference || !titre || !resultat || !objectif) return null;
    const mergedTitle = reference.id === titre.id;
    if (mergedTitle && !this.format.allowMergedReferenceAndTitle) return null;
    const expectedIds = new Set(selected.map((cell) => cell.id));
    if (
      expectedIds.size !== selected.length - Number(mergedTitle) ||
      row.some((cell) => !expectedIds.has(cell.id))
    )
      return null;
    return {
      reference,
      titre,
      resultat,
      objectif,
      objectifComplementaire,
    };
  }
}
