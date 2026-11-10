import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  ElectrificationEngagementCodeEnum as EngagementCode,
} from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import {
  ElectrificationDocumentSource,
  ElectrificationExtractionResponse,
} from './electrification-extraction.schema';
import { electrificationDocumentTemplate } from './electrification-document-template.constants';
import { ElectrificationValueInterpretationRules as Interpretation } from './electrification-value-interpretation.rules';
import {
  ElectrificationValueContext,
  ElectrificationValueRequest,
} from './electrification-value-interpretation.schema';

type Table = ElectrificationDocumentSource[][];
type Engagement = ElectrificationExtractionResponse['engagements'][number];
type Columns = {
  axe: number;
  engagement: number;
  selection: number;
  cible: number;
};

const numberPattern = '(?:[0-9]+|[0-9]{1,3}(?: [0-9]{3})+)(?:[.,][0-9]+)?';
const yearSuffix = "(?:\\s+(?:en|d'ici)\\s+2030)?";

/** Extraction du tableau A : sélection explicite et cibles sans interprétation. */
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
              electrificationDocumentTemplate.engagements.columns[column]
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

      const code = Object.entries(
        electrificationDocumentTemplate.engagements.labels
      ).find(
        ([, label]) => this.normalize(label) === this.normalize(engagement.text)
      )?.[0];
      const definition = catalogue.engagements.find(
        (item) => item.code === code
      );
      const expectedAxe = electrificationDocumentTemplate.engagements.axes.find(
        (item) => item.numero === definition?.axeNumero
      );
      if (
        !definition ||
        !expectedAxe ||
        !catalogue.axes.some(({ numero }) => numero === expectedAxe.numero) ||
        this.normalize(axe) !== this.normalize(expectedAxe.label)
      ) {
        issues.push(
          Errors.issue(
            'INVALID_ELECTRIFICATION_ENGAGEMENT',
            engagement.location
          )
        );
        continue;
      }

      const targets = this.parseTargets(
        definition.code,
        cible,
        engagement.text,
        valueContext
      );
      if (!targets.success) {
        issues.push(...targets.error);
        continue;
      }
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
    const expected = electrificationDocumentTemplate.engagements.columns;
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
    code: string,
    source: ElectrificationDocumentSource,
    label: string,
    context?: ElectrificationValueContext
  ): Result<Engagement['cibles'], ElectrificationIssue[]> {
    const invalid = () =>
      failure([
        Errors.issue('INVALID_ELECTRIFICATION_TARGET', source.location),
      ]);
    if (
      code === EngagementCode.DECOMMISSIONNEMENT_RESEAU_GAZ ||
      code === EngagementCode.SITE_RECHARGE_POIDS_LOURDS
    )
      return source.text.trim() ? invalid() : success([]);
    const bornes = code === EngagementCode.BORNES_RECHARGE_PUBLIQUES;
    const unite = bornes
      ? 'Nombre de bornes'
      : code === EngagementCode.ELECTRIFICATION_ARTISANS
      ? 'Nombre'
      : code === EngagementCode.ELECTRIFICATION_INDUSTRIE ||
        code === EngagementCode.ELECTRIFICATION_AGRICULTURE
      ? 'MWh'
      : '%';
    const request: ElectrificationValueRequest = {
      kind: 'target',
      source,
      label,
      unit: unite,
      year: 2030,
      keys: bornes ? ['total', 'rapides'] : ['principale'],
    };
    const text = Interpretation.text(request, context)
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, ' ');
    if (bornes) {
      const values = this.parseBornes(text);
      if (values === null) Interpretation.request(request, context);
      return values === null
        ? invalid()
        : success([
            this.target('total', values.total, 'Nombre de bornes', source.id),
            this.target(
              'rapides',
              values.rapides,
              'Nombre de bornes',
              source.id
            ),
          ]);
    }

    if (!text)
      return success([this.target('principale', null, unite, source.id)]);
    const unitPattern = unite === 'Nombre' ? 'artisans?' : unite.toLowerCase();
    const match = text.match(
      new RegExp(`^(${numberPattern})(?:\\s*${unitPattern})?${yearSuffix}$`)
    );
    if (!match) {
      Interpretation.request(request, context);
      return invalid();
    }
    const valeur = Values.number(match[1]);
    return valeur === null
      ? invalid()
      : success([this.target('principale', valeur, unite, source.id)]);
  }

  private static parseBornes(
    text: string
  ): { total: number | null; rapides: number | null } | null {
    if (!text) return { total: null, rapides: null };
    const both =
      text.match(
        new RegExp(
          `^(${numberPattern})(?:\\s+bornes(?: publiques)?)?\\s+dont\\s+(${numberPattern})\\s+(?:bornes\\s+)?rapides${yearSuffix}$`
        )
      ) ??
      text.match(
        new RegExp(
          `^total\\s*:\\s*(${numberPattern})\\s*;\\s*rapides\\s*:\\s*(${numberPattern})${yearSuffix}$`
        )
      );
    if (both) {
      const total = Values.number(both[1]);
      const rapides = Values.number(both[2]);
      return total === null || rapides === null ? null : { total, rapides };
    }
    const total = text.match(
      new RegExp(
        `^(?:total\\s*:\\s*(${numberPattern})|(${numberPattern})\\s+bornes publiques)${yearSuffix}$`
      )
    );
    if (total) {
      const value = Values.number(total[1] ?? total[2]);
      return value === null ? null : { total: value, rapides: null };
    }
    const rapides = text.match(
      new RegExp(
        `^(?:rapides\\s*:\\s*(${numberPattern})|(${numberPattern})\\s+(?:bornes\\s+)?rapides)${yearSuffix}$`
      )
    );
    if (!rapides) return null;
    const value = Values.number(rapides[1] ?? rapides[2]);
    return value === null ? null : { total: null, rapides: value };
  }

  private static target(
    key: string,
    valeur: number | null,
    unite: string,
    source: string
  ): Engagement['cibles'][number] {
    // Unité et année viennent du libellé fixe vérifié, même si la cellule ne contient qu'un nombre.
    return { key, valeur, unite, annee: 2030, source };
  }

  private static normalize(text: string): string {
    return Values.normalize(text)
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }
}
