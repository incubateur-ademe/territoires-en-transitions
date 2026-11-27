import { ElectrificationIndicateursTableAdapter } from './electrification-indicateurs-table.adapter';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  ElectrificationDocumentSource as Source,
  ElectrificationExtractionResponse as Response,
} from './electrification-extraction.schema';
import { ElectrificationIndicateursDocumentRules } from './electrification-indicateurs-document.rules';
import { electrificationFichesDocument } from '@tet/backend/plans/plans/electrification/config/electrification-fiches-document.config';
import { electrificationIndicateursDocument as indicateurs } from '@tet/backend/plans/plans/electrification/config/electrification-indicateurs-document.config';
import { ElectrificationValueContext } from './electrification-value-interpretation.schema';
import { electrificationDocumentFormats } from '@tet/backend/plans/plans/electrification/config/electrification-document-formats.config';

const { fields, sousActions } = electrificationFichesDocument;
export type ElectrificationFicheFieldName = keyof typeof fields;
const fieldDefinitions = (
  Object.keys(fields) as ElectrificationFicheFieldName[]
).map((key) => ({ key, ...fields[key] }));
export type ElectrificationFicheFields = Map<
  ElectrificationFicheFieldName,
  { source: Source; value: string | null }
>;
const headings = electrificationFichesDocument.headings.map(Values.normalize);
const noReference = { sourceId: null, value: null };
type Fiche = Response['fiches'][number];

type ChildSection = 'sousActions' | 'indicateurs';
type FicheForm = {
  fields: ElectrificationFicheFields;
  sousActions: Fiche['sousActions'];
  indicateurs: Fiche['indicateurs'];
  issues: ElectrificationIssue[];
};

/** Lit les sections communes et délègue les tableaux variables à leur adaptateur. */
export class ElectrificationFicheFormRules {
  static read(
    rows: Source[][],
    catalogue: ElectrificationConfig,
    valueContext?: ElectrificationValueContext
  ): FicheForm {
    // Les fusions horizontales sont développées par le lecteur ; un champ reste unique.
    const formRows = rows
      .map((row) => ({
        row,
        cells: [...new Map(row.map((cell) => [cell.id, cell])).values()],
      }))
      .filter(({ cells }) =>
        cells.some((cell) => cell.text.trim() || cell.links.length)
      );
    const format = rows
      .map((row) => ElectrificationIndicateursTableAdapter.fromHeader(row))
      .find((adapter) => adapter !== null)?.documentFormat;
    const placeholders: Partial<Record<ElectrificationFicheFieldName, string>> =
      format?.fieldPlaceholders ?? {};
    const titleDefinition = fields.titre;
    const titleCell = formRows.find(
      ({ cells }) =>
        Values.normalize(cells[0]?.text ?? '') ===
        Values.normalize(titleDefinition.label)
    )?.cells[1];
    const actionLocation = Locations.entity(
      'Action',
      titleCell
        ? Values.text(titleCell, [
            placeholders.titre ?? titleDefinition.placeholder,
            titleDefinition.placeholder,
          ])
        : null,
      rows[0]?.[0]?.location
    );
    const form: FicheForm = {
      fields: new Map(),
      sousActions: [],
      indicateurs: [],
      issues: [],
    };
    const { issues } = form;
    let section: 'fields' | ChildSection = 'fields';
    let childrenHeaderValid: boolean | null = null;
    let childIndex = 0;
    let indicateursAdapter: ElectrificationIndicateursTableAdapter | null =
      null;

    for (const [index, { row, cells: originalCells }] of formRows.entries()) {
      const cells =
        section === 'indicateurs'
          ? originalCells
          : this.locateRow(
              originalCells,
              section,
              actionLocation,
              childIndex + 1
            );
      const childSection = this.getChildSection(
        cells,
        formRows[index + 1]?.cells ?? []
      );
      if (childSection) {
        const heading =
          childSection === 'sousActions'
            ? sousActions.heading
            : indicateurs.heading;
        if (Values.normalize(cells[0].text) !== Values.normalize(heading)) {
          issues.push(
            Errors.unexpectedLabel(
              {
                ...cells[0],
                location: Locations.field(actionLocation, heading),
              },
              [heading]
            )
          );
        }
        section = childSection;
        childrenHeaderValid = null;
        childIndex = 0;
        indicateursAdapter = null;
        continue;
      }
      if (section === 'fields') {
        const field = this.readField(cells, form.fields, placeholders);
        if (!field.success) issues.push(...field.error);
        continue;
      }
      if (childrenHeaderValid === null) {
        indicateursAdapter =
          section === 'indicateurs'
            ? ElectrificationIndicateursTableAdapter.fromHeader(row)
            : null;
        childrenHeaderValid =
          section === 'indicateurs'
            ? indicateursAdapter !== null
            : this.isSousActionsHeader(cells);
        if (!childrenHeaderValid)
          issues.push(
            Errors.invalidTableHeader(
              cells,
              section === 'sousActions'
                ? [sousActions.columns]
                : Object.values(electrificationDocumentFormats).map(
                    ({ indicateurs }) =>
                      indicateurs.columns.map(({ label }) => label)
                  ),
              Locations.field(
                actionLocation,
                section === 'sousActions'
                  ? sousActions.heading
                  : indicateurs.heading
              )
            )
          );
        continue;
      }
      // Sans en-tête valide, les lignes ne peuvent pas être interprétées comme des données.
      if (!childrenHeaderValid) continue;
      childIndex += 1;
      if (section === 'sousActions') {
        const child = this.parseSousAction(cells);
        if (!child.success) issues.push(...child.error);
        else if (child.data) form.sousActions.push(child.data);
      } else {
        const indicatorCells = indicateursAdapter?.read(
          row,
          actionLocation,
          childIndex
        );
        if (!indicatorCells) {
          if (indicateursAdapter)
            issues.push(
              Errors.issue(
                'UNSUPPORTED_ELECTRIFICATION_STRUCTURE',
                actionLocation
              )
            );
          continue;
        }
        const child = ElectrificationIndicateursDocumentRules.parse(
          indicatorCells,
          catalogue,
          valueContext
        );
        if (!child.success) issues.push(...child.error);
        else if (child.data) form.indicateurs.push(child.data);
      }
    }
    return form;
  }

  private static locateRow(
    cells: Source[],
    section: 'fields' | 'sousActions',
    actionLocation: string,
    childIndex: number
  ): Source[] {
    if (section === 'fields') {
      const field = fieldDefinitions.find(
        ({ label }) =>
          Values.normalize(label) === Values.normalize(cells[0]?.text ?? '')
      );
      return cells.map((cell) => ({
        ...cell,
        location: Locations.field(
          actionLocation,
          field?.label ?? cells[0]?.text
        ),
      }));
    }
    const title = cells[0];
    const childLocation = Locations.entity(
      'Sous-action',
      title ? Values.text(title, sousActions.placeholders.titre) : null,
      `n°${childIndex}`
    );
    return cells.map((cell, index) => ({
      ...cell,
      location: Locations.field(
        Locations.field(actionLocation, childLocation),
        sousActions.columns[index]
      ),
    }));
  }

  static isEmpty(form: FicheForm): boolean {
    return (
      ![...form.fields.values()].some(
        ({ value, source }) => value !== null || source.links.length
      ) &&
      !form.sousActions.length &&
      !form.indicateurs.length
    );
  }

  private static getChildSection(
    cells: Source[],
    nextRow: Source[]
  ): ChildSection | null {
    if (cells.length !== 1) return null;
    switch (Values.normalize(cells[0].text)) {
      case Values.normalize(sousActions.heading):
        return 'sousActions';
      case Values.normalize(indicateurs.heading):
        return 'indicateurs';
      default:
        // L'en-tête exact permet de localiser une section mal nommée, sans l'accepter.
        if (headings.includes(Values.normalize(cells[0].text))) return null;
        if (this.isSousActionsHeader(nextRow)) return 'sousActions';
        if (ElectrificationIndicateursTableAdapter.fromHeader(nextRow))
          return 'indicateurs';
        return null;
    }
  }

  private static readField(
    cells: Source[],
    fields: ElectrificationFicheFields,
    placeholders: Partial<Record<ElectrificationFicheFieldName, string>>
  ): Result<void, ElectrificationIssue[]> {
    const label = Values.normalize(cells[0]?.text ?? '');
    if (cells.length === 1 && headings.includes(label))
      return success(undefined);
    if (label === Values.normalize(electrificationFichesDocument.budgetLabel))
      return success(undefined);
    const field = fieldDefinitions.find(
      ({ label: expected }) => Values.normalize(expected) === label
    );
    if (!field) {
      return failure([
        Errors.unexpectedLabel(
          cells[0],
          cells.length === 1
            ? electrificationFichesDocument.headings
            : fieldDefinitions.map(({ label }) => label)
        ),
      ]);
    }
    if (cells.length !== 2) {
      return failure([
        Errors.issue(
          'UNSUPPORTED_ELECTRIFICATION_STRUCTURE',
          cells[0]?.location
        ),
      ]);
    }
    const { key, placeholder } = field;
    if (fields.has(key)) {
      return failure([
        Errors.issue('DUPLICATE_ELECTRIFICATION_FIELD', cells[0].location),
      ]);
    }
    fields.set(key, {
      source: cells[1],
      value: Values.text(cells[1], [
        placeholders[key] ?? placeholder,
        placeholder,
      ]),
    });
    return success(undefined);
  }

  private static isSousActionsHeader(row: Source[]): boolean {
    const expected = sousActions.columns;
    return (
      row.length === expected.length &&
      row.every(
        (cell, index) =>
          Values.normalize(cell.text) === Values.normalize(expected[index])
      )
    );
  }

  private static parseSousAction(
    row: Source[]
  ): Result<Fiche['sousActions'][number] | null, ElectrificationIssue[]> {
    if (row.length !== 2)
      return failure([
        Errors.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE', row[0]?.location),
      ]);
    const titre = Values.text(row[0], sousActions.placeholders.titre);
    const date = Values.text(row[1], sousActions.placeholders.dateFin);
    if (titre === null && date === null) return success(null);
    if (titre === null)
      return failure([
        Errors.issue(
          'MISSING_ELECTRIFICATION_SOUS_ACTION_TITLE',
          row[0].location
        ),
      ]);
    const dateFin = date === null ? null : Values.date(date);
    if (date !== null && dateFin === null)
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_DATE', row[1].location),
      ]);
    return success({
      source: row[0].id,
      reference: noReference,
      champs: { ...this.createEmptyFields(), titre, dateFin },
    });
  }

  static createEmptyFields(): Fiche['champs'] {
    return {
      titre: null,
      description: null,
      objectifs: null,
      ressources: null,
      structures: null,
      partenaires: null,
      dateDebut: null,
      dateFin: null,
      statut: null,
    };
  }
}
