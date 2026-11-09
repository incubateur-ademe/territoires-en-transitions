import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig, StatutEnum } from '@tet/domain/plans';
import { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  ElectrificationDocumentSource as Source,
  ElectrificationExtractionResponse as Response,
} from './electrification-extraction.schema';
import {
  ElectrificationFicheFieldName,
  ElectrificationFicheFields,
  ElectrificationFicheFormRules as FormRules,
} from './electrification-fiche-form.rules';
import { ElectrificationValueContext } from './electrification-value-interpretation.schema';

type Fiche = Response['fiches'][number];
type Axe = Response['axes'][number];

export class ElectrificationFichesDocumentRules {
  static parse(
    rows: Source[][],
    catalogue: ElectrificationConfig,
    valueContext?: ElectrificationValueContext
  ): Result<{ axe: Axe; fiche: Fiche } | null, ElectrificationIssue[]> {
    const form = FormRules.read(rows, catalogue, valueContext);
    if (!form.issues.length && FormRules.isEmpty(form)) return success(null);

    const axe = this.parseAxe(form.fields, rows[0]?.[0]);
    const champs = this.parseFields(form.fields);
    const issues = [
      ...form.issues,
      ...(!axe.success ? axe.error : []),
      ...(!champs.success ? champs.error : []),
    ];
    if (!axe.success || !champs.success || issues.length)
      return failure(issues);

    const reference = form.fields.get('reference');
    return success({
      axe: axe.data,
      fiche: {
        source: form.fields.get('titre')?.source.id ?? axe.data.source,
        axeSourceKey: axe.data.sousAxes[0]?.source ?? axe.data.source,
        reference: reference
          ? Values.reference({
              ...reference.source,
              text: reference.value ?? '',
            })
          : { sourceId: null, value: null },
        champs: champs.data,
        sousActions: form.sousActions,
        indicateurs: form.indicateurs,
      },
    });
  }

  private static parseAxe(
    fields: ElectrificationFicheFields,
    fallbackSource: Source | undefined
  ): Result<Axe, ElectrificationIssue[]> {
    const axe = fields.get('axe');
    if (!axe || axe.value === null) {
      return failure([
        Errors.issue(
          'INVALID_ELECTRIFICATION_FIELD',
          axe?.source.location ?? fallbackSource?.location
        ),
      ]);
    }
    const match = axe.value.match(
      /^(?:axe\s+)?(\d+)(?:(?:[.:–—-]\s+|\s+)(.+))?$/i
    );
    if (/^(?:axe\s*)?\d/i.test(axe.value) && !match) {
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_FIELD', axe.source.location),
      ]);
    }
    const sousAxe = this.parseSousAxe(fields);
    if (!sousAxe.success) return sousAxe;
    return success({
      source: axe.source.id,
      numero: match ? Number(match[1]) : null,
      titre: match?.[2]?.trim() || axe.value,
      sousAxes: sousAxe.data ? [sousAxe.data] : [],
    });
  }

  private static parseSousAxe(
    fields: ElectrificationFicheFields
  ): Result<Axe['sousAxes'][number] | null, ElectrificationIssue[]> {
    const field = fields.get('sousAxe');
    if (!field?.value) return success(null);
    const match = field.value.match(
      /^(?:sous[- ]axe\s+)?(\d+\.\d+)(?:(?:[.:–—-]\s+|\s+)(.+))?$/i
    );
    if (/^(?:sous[- ]axe\s*)?\d/i.test(field.value) && !match) {
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_FIELD', field.source.location),
      ]);
    }
    return success({
      source: field.source.id,
      numero: match?.[1] ?? null,
      titre: match?.[2]?.trim() || field.value,
    });
  }

  private static parseFields(
    fields: ElectrificationFicheFields
  ): Result<Fiche['champs'], ElectrificationIssue[]> {
    const get = (key: ElectrificationFicheFieldName) =>
      fields.get(key)?.value ?? null;
    const champs: Fiche['champs'] = {
      ...FormRules.createEmptyFields(),
      titre: get('titre'),
      description: get('description'),
      objectifs: get('objectifs'),
      structures: Values.names(get('structures')),
      partenaires: Values.names(get('partenaires')),
    };
    const issues: ElectrificationIssue[] = [];
    for (const key of ['dateDebut', 'dateFin'] as const) {
      const value = get(key);
      champs[key] = value === null ? null : Values.date(value);
      if (value !== null && champs[key] === null) {
        issues.push(
          Errors.issue(
            'INVALID_ELECTRIFICATION_DATE',
            fields.get(key)?.source.location
          )
        );
      }
    }
    const statut = get('statut');
    if (statut !== null) {
      champs.statut =
        Object.values(StatutEnum).find(
          (value) => Values.normalize(value) === Values.normalize(statut)
        ) ?? null;
      if (champs.statut === null) {
        issues.push(
          Errors.issue(
            'INVALID_ELECTRIFICATION_FIELD',
            fields.get('statut')?.source.location
          )
        );
      }
    }
    return issues.length ? failure(issues) : success(champs);
  }
}
