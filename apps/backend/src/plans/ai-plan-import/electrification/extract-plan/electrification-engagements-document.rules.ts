import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import {
  ElectrificationDocumentSource,
  ElectrificationExtractionResponse,
} from './electrification-extraction.schema';
import { electrificationEngagementsDocument } from '@tet/backend/plans/plans/electrification/config/electrification-engagements-document.config';
import { ElectrificationValueInterpretationRules as Interpretation } from './electrification-value-interpretation.rules';
import {
  ElectrificationValueContext,
  ElectrificationValueRequest,
} from './electrification-value-interpretation.schema';
import { ElectrificationCatalogueRules } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-catalogue.rules';
import { ElectrificationEngagementValuesRules } from '../resolve-engagements/electrification-engagement-values.rules';
import { ElectrificationEngagementsErrors } from '../resolve-engagements/electrification-engagements.errors';

type Table = ElectrificationDocumentSource[][];
type Engagement = ElectrificationExtractionResponse['engagements'][number];
type Columns = {
  axe: number;
  engagement: number;
  selection: number;
  cible: number;
};

/** Lecture du tableau A et adaptation des valeurs extraites vers les cibles du catalogue. */
export class ElectrificationEngagementsDocumentRules {
  static parse(
    table: Table,
    catalogue: ElectrificationConfig,
    valueContext?: ElectrificationValueContext
  ): Result<Engagement[], ElectrificationIssue[]> {
    const columns = this.getColumns(table[0] ?? []);
    if (!columns) {
      return failure([
        Errors.issue(
          'INVALID_ELECTRIFICATION_ENGAGEMENT_TABLE',
          table[0]?.[0]?.location
        ),
      ]);
    }

    const engagements: Engagement[] = [];
    const issues: ElectrificationIssue[] = [];
    const selectedCodes = new Set<string>();
    let axe = '';
    for (const row of table.slice(1)) {
      if (row.every((cell) => !cell.text.trim())) continue;
      if (this.getColumns(row)) continue; // En-tête répété après un saut de page.
      const axeCell = row[columns.axe];
      const location = Locations.entity(
        'Engagement',
        row[columns.engagement]?.text,
        row[0]?.location
      );
      const locate = (column: keyof Columns) => {
        const cell = row[columns[column]];
        return (
          cell && {
            ...cell,
            location: Locations.field(
              location,
              electrificationEngagementsDocument.columns[column]
            ),
          }
        );
      };
      const engagement = locate('engagement');
      const selection = locate('selection');
      const cible = locate('cible');
      if (row.length !== 4 || !axeCell || !engagement || !selection || !cible) {
        issues.push(
          Errors.issue(
            'INVALID_ELECTRIFICATION_ENGAGEMENT_TABLE',
            row[0]?.location
          )
        );
        continue;
      }
      const socle = electrificationEngagementsDocument.socleCommun;
      if (
        this.normalize(axeCell.text) === this.normalize(socle.axe) &&
        this.normalize(selection.text) === this.normalize(socle.selection)
      )
        continue;
      if (axeCell.text.trim()) axe = axeCell.text;

      const retained = this.normalize(selection.text);
      if (retained === 'non') continue;
      if (!retained && !cible.text.trim()) continue;
      if (retained !== 'oui') {
        issues.push(
          Errors.issue('INVALID_ELECTRIFICATION_SELECTION', selection.location)
        );
        continue;
      }

      const axeNumero = axe.match(/^\s*Axe\s+(\d+)(?:[. :]|$)/i)?.[1];
      const identified = catalogue.engagements.find(
        ({ code }) => code === engagement.text.trim()
      );
      const label = ElectrificationCatalogueRules.normalizeEngagementLabel(
        engagement.text
      );
      const matchingLabels = catalogue.engagements.filter(
        (item) =>
          ElectrificationCatalogueRules.normalizeEngagementLabel(
            item.libelleSource
          ) === label
      );
      const candidates = matchingLabels.filter(
        (item) => item.axeNumero === Number(axeNumero)
      );
      const match = valueContext?.engagementInterpretations?.find(
        ({ sourceId }) => sourceId === engagement.id
      );
      const definition =
        identified ??
        (candidates.length === 1
          ? candidates[0]
          : match?.quote === engagement.text
          ? catalogue.engagements.find(({ code }) => code === match.code)
          : undefined);
      if (
        !identified &&
        !matchingLabels.length &&
        !match &&
        engagement.text.length <= 2000 &&
        !engagement.links.length
      ) {
        const available = catalogue.engagements.flatMap(
          ({ code, axeNumero: numero, libelleSource }) =>
            numero === Number(axeNumero) ? [{ code, label: libelleSource }] : []
        );
        if (available.length)
          valueContext?.onUnmatchedEngagement?.({
            source: engagement,
            candidates: available,
          });
      }
      if (
        !definition ||
        Number(axeNumero) !== definition.axeNumero ||
        !catalogue.axes.some(({ numero }) => numero === definition.axeNumero)
      ) {
        issues.push(
          Errors.issue(
            'INVALID_ELECTRIFICATION_ENGAGEMENT',
            engagement.location
          )
        );
        continue;
      }

      if (selectedCodes.has(definition.code)) {
        issues.push(
          ElectrificationEngagementsErrors.duplicate(
            definition.code,
            engagement.location
          )
        );
      }
      selectedCodes.add(definition.code);
      const targets = this.parseTargets(
        definition,
        cible,
        engagement.text,
        valueContext
      );
      if (!targets.success) {
        issues.push(...targets.error);
        continue;
      }
      issues.push(
        ...ElectrificationEngagementValuesRules.validate(
          definition,
          targets.data.map((target) => ({
            ...target,
            location: cible.location,
          }))
        )
      );
      engagements.push({
        code: definition.code,
        source: engagement.id,
        cibles: targets.data,
      });
    }
    return issues.length ? failure(issues) : success(engagements);
  }

  private static getColumns(
    row: ElectrificationDocumentSource[]
  ): Columns | null {
    const labels = row.map((cell) => this.normalize(cell.text));
    const expected = electrificationEngagementsDocument.columns;
    const columns = {
      axe: labels.findIndex((label) =>
        label.startsWith(this.normalize(expected.axe))
      ),
      engagement: labels.findIndex(
        (label) => label === this.normalize(expected.engagement)
      ),
      selection: labels.findIndex((label) =>
        label.startsWith(this.normalize(expected.selection))
      ),
      cible: labels.findIndex((label) =>
        label.startsWith(this.normalize(expected.cible))
      ),
    };
    return Object.values(columns).every((index) => index >= 0) &&
      row.length === 4
      ? columns
      : null;
  }

  private static parseTargets(
    definition: ElectrificationConfig['engagements'][number],
    source: ElectrificationDocumentSource,
    label: string,
    context?: ElectrificationValueContext
  ): Result<Engagement['cibles'], ElectrificationIssue[]> {
    if (!definition.cibles.length)
      return source.text.trim()
        ? failure([
            Errors.valueIssue('UNEXPECTED_ELECTRIFICATION_TARGET', source),
          ])
        : success([]);
    const targets: Extract<
      ElectrificationValueRequest,
      { kind: 'target' }
    >['targets'] = [];
    for (const cible of definition.cibles) {
      const rules = cible.reglesImport;
      targets.push({
        key: cible.key,
        unit: cible.uniteImport,
        year: rules.annee,
        ceilingKey: rules.plafondCible,
        labels: rules.libelles,
        units: rules.unites,
      });
    }
    const request: ElectrificationValueRequest = {
      kind: 'target',
      source,
      label,
      targets,
      unit: targets.every(({ unit }) => unit === targets[0].unit)
        ? targets[0].unit
        : null,
      year: targets.every(({ year }) => year === targets[0].year)
        ? targets[0].year
        : null,
      keys: targets.map(({ key }) => key),
    };
    const values = Interpretation.read(request, context);
    if (values === null)
      return failure([Errors.invalidTarget(source, definition.cibles)]);
    return success(
      targets.map(({ key, unit, year }) => ({
        key,
        valeur: values.find((value) => value.key === key)?.value ?? null,
        unite: unit,
        annee: year,
        source: source.id,
      }))
    );
  }

  private static normalize(text: string): string {
    return Values.normalize(text)
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }
}
