import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  ElectrificationDocumentSource as Source,
  ElectrificationExtractionResponse as Response,
} from './electrification-extraction.schema';
import { ElectrificationIndicateursDocumentRules } from './electrification-indicateurs-document.rules';
import { electrificationDocumentTemplate } from './electrification-document-template.constants';
import { ElectrificationValueContext } from './electrification-value-interpretation.schema';

const {
  fields: fieldDefinitions,
  sousActions,
  indicateurs,
} = electrificationDocumentTemplate.fiches;
export type ElectrificationFicheFieldName =
  (typeof fieldDefinitions)[number]['key'];
export type ElectrificationFicheFields = Map<
  ElectrificationFicheFieldName,
  { source: Source; value: string | null }
>;
const headings = electrificationDocumentTemplate.fiches.headings.map(
  Values.normalize
);
const noReference = { sourceId: null, value: null };
type Fiche = Response['fiches'][number];

type ChildSection = 'sousActions' | 'indicateurs';
type FicheForm = {
  fields: ElectrificationFicheFields;
  sousActions: Fiche['sousActions'];
  indicateurs: Fiche['indicateurs'];
  issues: ElectrificationIssue[];
};

/** Lit les sections du formulaire V4 et conserve la source de chaque champ. */
export class ElectrificationFicheFormRules {
  static read(
    rows: Source[][],
    catalogue: ElectrificationConfig,
    valueContext?: ElectrificationValueContext
  ): FicheForm {
    const form: FicheForm = {
      fields: new Map(),
      sousActions: [],
      indicateurs: [],
      issues: [],
    };
    const { issues } = form;
    let section: 'fields' | ChildSection = 'fields';
    let hasChildrenHeader = false;

    for (const row of rows) {
      // Les fusions horizontales sont développées par le lecteur ; un champ reste unique.
      const cells = [...new Map(row.map((cell) => [cell.id, cell])).values()];
      if (!cells.some((cell) => cell.text.trim() || cell.links.length))
        continue;
      const childSection = this.getChildSection(cells);
      if (childSection) {
        section = childSection;
        hasChildrenHeader = false;
        continue;
      }
      if (section === 'fields') {
        const field = this.readField(cells, form.fields);
        if (!field.success) issues.push(...field.error);
        continue;
      }
      if (!hasChildrenHeader) {
        if (!this.isChildrenHeader(cells, section))
          issues.push(
            Errors.issue(
              'UNSUPPORTED_ELECTRIFICATION_STRUCTURE',
              cells[0]?.location
            )
          );
        hasChildrenHeader = true;
        continue;
      }
      if (section === 'sousActions') {
        const child = this.parseSousAction(cells);
        if (!child.success) issues.push(...child.error);
        else if (child.data) form.sousActions.push(child.data);
      } else {
        const child = ElectrificationIndicateursDocumentRules.parse(
          cells,
          catalogue,
          valueContext
        );
        if (!child.success) issues.push(...child.error);
        else if (child.data) form.indicateurs.push(child.data);
      }
    }
    return form;
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

  private static getChildSection(cells: Source[]): ChildSection | null {
    if (cells.length !== 1) return null;
    switch (Values.normalize(cells[0].text)) {
      case Values.normalize(sousActions.heading):
        return 'sousActions';
      case Values.normalize(indicateurs.heading):
        return 'indicateurs';
      default:
        return null;
    }
  }

  private static readField(
    cells: Source[],
    fields: ElectrificationFicheFields
  ): Result<void, ElectrificationIssue[]> {
    const label = Values.normalize(cells[0]?.text ?? '');
    if (cells.length === 1 && headings.includes(label))
      return success(undefined);
    if (
      label ===
      Values.normalize(electrificationDocumentTemplate.fiches.budgetLabel)
    )
      return success(undefined);
    const field = fieldDefinitions.find(
      ({ label: expected }) => Values.normalize(expected) === label
    );
    if (!field || cells.length !== 2) {
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
        Errors.issue('INVALID_ELECTRIFICATION_FIELD', cells[0].location),
      ]);
    }
    fields.set(key, {
      source: cells[1],
      value: Values.text(cells[1], placeholder),
    });
    return success(undefined);
  }

  private static isChildrenHeader(
    row: Source[],
    section: 'sousActions' | 'indicateurs'
  ): boolean {
    const expected = electrificationDocumentTemplate.fiches[section].columns;
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
        Errors.issue('INVALID_ELECTRIFICATION_FIELD', row[0].location),
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
