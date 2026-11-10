import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  ElectrificationDocumentSource as Source,
  ElectrificationExtractionResponse,
} from './electrification-extraction.schema';
import { electrificationDocumentTemplate } from './electrification-document-template.constants';
import { ElectrificationValueInterpretationRules as Interpretation } from './electrification-value-interpretation.rules';
import {
  ElectrificationValueContext,
  ElectrificationValueRequest,
} from './electrification-value-interpretation.schema';

type Indicateur =
  ElectrificationExtractionResponse['fiches'][number]['indicateurs'][number];
type Observation = {
  value: number | boolean | null;
  year: number | null;
  unit: string | null;
};

/** Les colonnes du formulaire distinguent résultat daté et objectif 2030. */
export class ElectrificationIndicateursDocumentRules {
  static parse(
    row: Source[],
    catalogue: ElectrificationConfig,
    valueContext?: ElectrificationValueContext
  ): Result<Indicateur | null, ElectrificationIssue[]> {
    if (row.length !== 4)
      return failure([
        Errors.issue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE', row[0]?.location),
      ]);
    const [reference, title, result, target] = row;
    const { placeholders } = electrificationDocumentTemplate.fiches.indicateurs;
    const ref = Values.reference(reference, placeholders.reference);
    const titre = Values.text(title, placeholders.titre);
    if (
      ref.sourceId === null &&
      titre === null &&
      !result.text.trim() &&
      !target.text.trim()
    )
      return success(null);
    const label = titre ?? '';
    const unit = this.titleUnit(titre);
    const mapping = catalogue.fiches.indicateurs?.find(
      ({ code }) => code === ref.value
    );
    const declaredBoolean =
      mapping?.type === 'booleen' || /\(oui\s*\/\s*non\)/i.test(label);
    const numericContext = declaredBoolean ? undefined : valueContext;
    const resultat = this.observation(
      result,
      null,
      label,
      unit,
      numericContext
    );
    const objectif = this.observation(
      target,
      2030,
      label,
      unit,
      numericContext
    );
    if (!resultat.success || !objectif.success)
      return failure([
        ...(!resultat.success ? resultat.error : []),
        ...(!objectif.success ? objectif.error : []),
      ]);
    const base = { source: reference.id, reference: ref, titre };
    const boolean =
      declaredBoolean ||
      typeof resultat.data.value === 'boolean' ||
      typeof objectif.data.value === 'boolean';
    if (boolean) {
      if (
        [resultat.data.value, objectif.data.value].some(
          (value) => typeof value === 'number'
        ) ||
        resultat.data.unit ||
        objectif.data.unit
      )
        return failure([
          Errors.issue('INVALID_ELECTRIFICATION_INDICATEUR', result.location),
        ]);
      return success({
        ...base,
        type: 'booleen',
        resultat: resultat.data.value as boolean | null,
        anneeResultat: resultat.data.year,
        objectif: objectif.data.value as boolean | null,
        anneeObjectif: objectif.data.year,
      });
    }
    const titleUnit = this.titleUnit(titre);
    const units = [titleUnit, resultat.data.unit, objectif.data.unit].filter(
      (unit): unit is string => unit !== null
    );
    if (new Set(units).size > 1)
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_INDICATEUR', title.location),
      ]);
    return success({
      ...base,
      type: 'quantitatif',
      unite: units[0] ?? null,
      periodicite: 'annuelle',
      resultat: {
        valeur: resultat.data.value as number | null,
        periode: resultat.data.year?.toString() ?? null,
      },
      objectif: {
        valeur: objectif.data.value as number | null,
        periode: objectif.data.year?.toString() ?? null,
      },
    });
  }

  private static titleUnit(title: string | null): string | null {
    if (title === null) return null;
    const explicit = title
      .match(/\(unit[eé]\s*:\s*([^()]+)\)\s*$/i)?.[1]
      ?.trim();
    if (explicit) return explicit;
    // Un complément comme "(dont précaires)" ne remplace pas l'unité de comptage.
    if (/^nombre\s+(?:de\s|d['’])/i.test(title)) return 'Nombre';
    const symbol = title.match(/\(([^()]+)\)\s*$/)?.[1]?.trim();
    return symbol && Values.isUnit(symbol) ? symbol : null;
  }

  private static observation(
    source: Source,
    defaultYear: number | null,
    label: string,
    unit: string | null,
    context?: ElectrificationValueContext
  ): Result<Observation, ElectrificationIssue[]> {
    const request: ElectrificationValueRequest = {
      kind: 'observation',
      source,
      label,
      unit,
      year: defaultYear,
      keys: ['valeur'],
    };
    const text = Interpretation.text(request, context).trim();
    if (!text) return success({ value: null, year: defaultYear, unit: null });
    const date = text.match(/\s*(?:\((\d{4})\)|en\s+(\d{4}))\s*$/i);
    const year = date ? Number(date[1] ?? date[2]) : defaultYear;
    if (year === 0 || (date && defaultYear !== null && year !== defaultYear))
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_INDICATEUR', source.location),
      ]);
    const value = date ? text.slice(0, date.index).trim() : text;
    const boolean = Values.normalize(value);
    if (boolean === 'oui' || boolean === 'non')
      return year === null
        ? failure([Errors.issue('MISSING_INDICATEUR_YEAR', source.location)])
        : success({ value: boolean === 'oui', year, unit: null });
    const number = value.match(
      new RegExp(`^(${Values.NUMBER_LITERAL})(?:\\s+([^\\d\\s].*)|\\s*(%))?$`)
    );
    const parsed = number ? Values.number(number[1]) : null;
    const parsedUnit = (number?.[2] ?? number?.[3])?.trim() ?? null;
    if (
      parsed === null ||
      (parsedUnit !== null && !Values.isUnit(parsedUnit))
    ) {
      Interpretation.request(request, context);
      return failure([
        Errors.issue('INVALID_ELECTRIFICATION_INDICATEUR', source.location),
      ]);
    }
    return year === null
      ? failure([Errors.issue('MISSING_INDICATEUR_YEAR', source.location)])
      : success({ value: parsed, year, unit: parsedUnit });
  }
}
