import { escapeRegExp } from 'es-toolkit';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import {
  ElectrificationInterpretedValue,
  ElectrificationValueContext,
  ElectrificationValueRequest,
  ElectrificationValueResponse,
} from './electrification-value-interpretation.schema';

const numberLiteralPattern = new RegExp(
  `(?<![\\p{L}\\p{N}])${Values.NUMBER_LITERAL}(?:[eE][+-]?\\d+)?(?!\\p{N})`,
  'gu'
);
const literalPattern = new RegExp(
  `^(${Values.NUMBER_LITERAL})(?:\\s+(${Values.UNIT_TOKEN})|\\s*(%))?(?:\\s*\\((\\d{4})\\))?$`,
  'u'
);

/** Vérifie les preuves et le contrat numérique ; le sens des phrases relève du modèle. */
export class ElectrificationValueInterpretationRules {
  static numbers(text: string) {
    return [...text.matchAll(numberLiteralPattern)].map((match, id) => ({
      id,
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    }));
  }

  static read(
    request: ElectrificationValueRequest,
    context?: ElectrificationValueContext
  ): ElectrificationInterpretedValue[] | null {
    const interpretation = context?.interpretations?.find(
      ({ sourceId }) => sourceId === request.source.id
    );
    if (interpretation) return this.resolve(request, interpretation);
    const text = request.source.text.trim();
    if (!text) return [];
    // Une seule cible identifiable et un littéral complet n'exigent aucune lecture sémantique.
    const literal =
      request.keys.length === 1 ? text.match(literalPattern) : null;
    if (literal) {
      const value = Values.number(literal[1]);
      if (value === null) return null;
      const result = {
        key: request.keys[0],
        value,
        unit: literal[2] ?? literal[3] ?? null,
        year: literal[4] ? Number(literal[4]) : null,
      };
      // Sans unité déclarée, un mot après le nombre peut aussi être une réserve.
      if (
        request.kind !== 'observation' ||
        request.unit !== null ||
        result.unit === null
      )
        return this.accepts(request, result) ? [result] : null;
    }
    const numbers = this.numbers(text);
    if (
      !request.source.links.length &&
      text.length <= 2000 &&
      numbers.length > 0 &&
      numbers.length <= 100
    )
      context?.onUnparsedValue?.(request);
    return null;
  }

  /** Chaque quantité a son occurrence ; une échéance commune peut être partagée. */
  static hasEvidence(
    text: string,
    response: ElectrificationValueResponse
  ): boolean {
    if (response.status !== 'extracted' || !response.values.length)
      return false;
    const numbers = this.numbers(text);
    const quantities = new Set<number>();
    const years = new Set<number>();
    const keys = new Set<string>();
    for (const value of response.values) {
      const number = numbers[value.numberId];
      const year = value.yearId === null ? null : numbers[value.yearId];
      if (
        !number ||
        (value.yearId !== null && (!year || !/^[1-9]\d{3}$/.test(year.text))) ||
        keys.has(value.key) ||
        quantities.has(value.numberId)
      )
        return false;
      const start = text.lastIndexOf(value.quote, number.start);
      const end = start + value.quote.length;
      if (
        start < 0 ||
        number.end > end ||
        (year && (year.start < start || year.end > end))
      )
        return false;
      if (
        value.unit !== null &&
        !new RegExp(
          `(?<![\\p{L}])${escapeRegExp(value.unit)}(?![\\p{L}\\p{N}])`,
          'u'
        ).test(value.quote)
      )
        return false;
      quantities.add(value.numberId);
      if (value.yearId !== null) years.add(value.yearId);
      keys.add(value.key);
    }
    return (
      [...quantities].every((id) => !years.has(id)) &&
      quantities.size + years.size === numbers.length
    );
  }

  static resolve(
    request: ElectrificationValueRequest,
    response: ElectrificationValueResponse
  ): ElectrificationInterpretedValue[] | null {
    if (!this.hasEvidence(request.source.text, response)) return null;
    const numbers = this.numbers(request.source.text);
    const values: ElectrificationInterpretedValue[] = [];
    for (const value of response.values) {
      const number = Values.number(numbers[value.numberId].text);
      if (number === null) return null;
      const result = {
        key: value.key,
        value: number,
        unit: value.unit,
        year: value.yearId === null ? null : Number(numbers[value.yearId].text),
      };
      if (!this.accepts(request, result)) return null;
      values.push(result);
    }
    if (
      request.kind === 'observation' &&
      (values.length !== 1 || (values[0].year ?? request.year) === null)
    )
      return null;
    return values;
  }

  private static accepts(
    request: ElectrificationValueRequest,
    value: ElectrificationInterpretedValue
  ): boolean {
    if (
      !Number.isFinite(value.value) ||
      (value.year !== null && (value.year < 1000 || value.year > 9999))
    )
      return false;
    if (request.kind === 'observation') {
      return (
        value.key === 'valeur' &&
        (value.year === null ||
          request.year === null ||
          value.year === request.year)
      );
    }
    const target = request.targets.find(({ key }) => key === value.key);
    return (
      !!target &&
      (value.unit === null ||
        [target.unit, ...target.units].includes(value.unit)) &&
      (value.year === null || value.year === target.year)
    );
  }
}
