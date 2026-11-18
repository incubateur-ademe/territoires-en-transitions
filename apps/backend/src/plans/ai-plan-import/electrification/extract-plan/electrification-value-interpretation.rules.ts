import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import {
  ElectrificationValueContext,
  ElectrificationValueRequest,
  ElectrificationValueResponse,
} from './electrification-value-interpretation.schema';

type InterpretedValue = ElectrificationValueResponse['values'][number];
type ValueSegment = { text: string; quote: string; afterNumber: string };
const numberLiteralPattern = new RegExp(
  `(?<![\\p{L}\\p{N}])${Values.NUMBER_LITERAL}(?![\\p{L}\\p{N}])`,
  'gu'
);

/** Contrôles de l'aide à la lecture ; ils ne prouvent pas la justesse sémantique. */
export class ElectrificationValueInterpretationRules {
  static isCandidate({
    source,
    kind,
    year,
  }: ElectrificationValueRequest): boolean {
    const text = Values.normalize(source.text);
    if (
      source.links.length ||
      text.length > 2000 ||
      !/[a-z]/.test(text) ||
      !this.numbers(text).length ||
      /https?:|www\./.test(text) ||
      /\d\s*e[+-]?\d/.test(text) ||
      /\b(?:si|sous reserve|condition|conditionnel|abandonne|annule|envisage|confirmer|pas|non|jamais|aucun)\b/.test(
        text
      ) ||
      /\b(?:entre|environ|approximativement|presque|minimum|maximum|moins|plus|ou|fourchette)\b|[<>≤≥≈~]|\d\s*(?:a|[-–—/])\s*\d/.test(
        text
      )
    )
      return false;
    const explicitYears = [
      ...text.matchAll(/(?:\b(?:en|pour|annee|d'ici)\s+|\()([12]\d{3})\b/g),
    ];
    if (
      year !== null &&
      explicitYears.some(([, value]) => Number(value) !== year)
    )
      return false;
    // Un résultat doit porter sa propre année, sans la déduire du contexte.
    if (kind === 'observation' && year === null) {
      return (
        this.numbers(text).length >= 2 &&
        /(?:\b(?:en|pour|annee)\s+[12]\d{3}\b|\([12]\d{3}\))/.test(text)
      );
    }
    return true;
  }

  static text(
    request: ElectrificationValueRequest,
    context?: ElectrificationValueContext
  ): string {
    const interpretation = context?.interpretations?.find(
      ({ sourceId }) => sourceId === request.source.id
    );
    return interpretation
      ? this.normalize(request, interpretation.values) ?? request.source.text
      : request.source.text;
  }

  static request(
    request: ElectrificationValueRequest,
    context?: ElectrificationValueContext
  ): void {
    if (this.isCandidate(request)) context?.onUnparsedValue?.(request);
  }

  /** Vérifie les citations et que chaque nombre du texte a été pris en compte. */
  static hasEvidence(text: string, values: InterpretedValue[]): boolean {
    if (
      !values.length ||
      new Set(values.map(({ key }) => key)).size !== values.length
    )
      return false;
    const expectedNumbers: string[] = [];
    const years = new Set<string>();
    for (const value of values) {
      if (
        !text.includes(value.quote) ||
        !value.quote.includes(value.number) ||
        Values.number(value.number) === null ||
        !this.numbers(value.quote).includes(
          Values.numericLiteral(value.number)
        ) ||
        (value.unit !== null && !value.quote.includes(value.unit)) ||
        (value.year !== null &&
          (!/^[1-9]\d{3}$/.test(value.year) ||
            !this.numbers(value.quote).includes(value.year)))
      )
        return false;
      const quotedNumbers = this.numbers(value.quote);
      const justifiedNumbers = [
        Values.numericLiteral(value.number),
        ...(value.year === null ? [] : [value.year]),
      ];
      if (
        JSON.stringify(quotedNumbers.sort()) !==
        JSON.stringify(justifiedNumbers.sort())
      )
        return false;
      expectedNumbers.push(Values.numericLiteral(value.number));
      if (value.year !== null) years.add(value.year);
    }
    // Retirer d'abord les quantités, même si leur littéral est égal à une année.
    const remaining = this.numbers(text);
    for (const number of expectedNumbers) {
      const index = remaining.indexOf(number);
      if (index < 0) return false;
      remaining.splice(index, 1);
    }
    // Une même année peut qualifier plusieurs valeurs, mais ne peut pas être inventée.
    return (
      remaining.every((number) => years.has(number)) &&
      [...years].every((year) => remaining.includes(year))
    );
  }

  static normalize(
    request: ElectrificationValueRequest,
    values: InterpretedValue[]
  ): string | null {
    if (
      !this.isCandidate(request) ||
      !this.hasEvidence(request.source.text, values)
    )
      return null;
    for (const value of values) {
      const segment = this.valueSegment(request.source.text, value);
      if (
        !segment ||
        !(request.keys as readonly string[]).includes(value.key) ||
        !this.preservesUnit(request, value, segment) ||
        !this.preservesYear(request, value, segment) ||
        (value.unit !== null &&
          (!segment.quote.includes(value.unit) ||
            !this.acceptsUnit(request, value, value.unit))) ||
        (request.kind === 'target' &&
          request.keys.length > 1 &&
          !this.hasTargetLabel(request, value, segment.quote))
      )
        return null;
    }
    if (request.kind === 'observation') {
      if (values.length !== 1) return null;
      const value = values[0];
      if (request.year === null && value.year === null) return null;
      return `${value.number}${value.unit ? ` ${value.unit}` : ''}${
        value.year ? ` (${value.year})` : ''
      }`;
    }
    if (request.keys.length === 1)
      return values.length === 1 ? values[0].number : null;
    return values.map(({ key, number }) => `${key}: ${number}`).join('; ');
  }

  /** Le libellé, l'unité et l'année appartiennent au segment du nombre cité. */
  private static valueSegment(
    text: string,
    value: InterpretedValue
  ): ValueSegment | null {
    const number = [...value.quote.matchAll(numberLiteralPattern)].find(
      ([literal]) =>
        Values.numericLiteral(literal) === Values.numericLiteral(value.number)
    );
    if (!number) return null;
    const quoteStart = text.indexOf(value.quote);
    const numberStart = quoteStart + number.index;
    const before = text.slice(0, numberStart);
    const segmentStart =
      Math.max(before.lastIndexOf(';'), before.lastIndexOf('\n')) + 1;
    const separator = text.slice(numberStart).search(/[;\n]/);
    const segmentEnd = separator < 0 ? text.length : numberStart + separator;
    return {
      text: text.slice(segmentStart, segmentEnd),
      quote: text.slice(
        Math.max(quoteStart, segmentStart),
        Math.min(quoteStart + value.quote.length, segmentEnd)
      ),
      afterNumber: text.slice(numberStart + number[0].length, segmentEnd),
    };
  }

  private static hasTargetLabel(
    request: Extract<ElectrificationValueRequest, { kind: 'target' }>,
    value: InterpretedValue,
    quote: string
  ): boolean {
    const target = request.targets.find(({ key }) => key === value.key);
    if (!target) return false;
    const words = (text: string) =>
      Values.normalize(text)
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
    const quotedWords = ` ${words(quote)} `;
    return [target.key, ...target.labels].some((label) => {
      const expected = words(label);
      return expected !== '' && quotedWords.includes(` ${expected} `);
    });
  }

  private static preservesYear(
    request: ElectrificationValueRequest,
    value: InterpretedValue,
    segment: ValueSegment
  ): boolean {
    const expected =
      request.kind === 'target'
        ? request.targets.find(({ key }) => key === value.key)?.year
        : request.year ?? (value.year === null ? null : Number(value.year));
    if (
      value.year !== null &&
      (Number(value.year) !== expected ||
        this.numbers(segment.quote).length !== this.numbers(value.quote).length)
    )
      return false;
    return [
      ...Values.normalize(segment.text).matchAll(
        /(?:\b(?:en|pour|annee|d'ici)\s+|\()([1-9]\d{3})\b/g
      ),
    ].every(([, year]) => Number(year) === expected);
  }

  /** Une citation tronquée ne doit pas faire disparaître l'unité accolée au nombre. */
  private static preservesUnit(
    request: ElectrificationValueRequest,
    value: InterpretedValue,
    segment: ValueSegment
  ): boolean {
    const unit = segment.afterNumber.match(
      new RegExp(`^\\s*(${Values.UNIT_TOKEN})`, 'u')
    )?.[1];
    // Ces mots relient une quantité à son contexte ; ils ne sont pas des unités.
    if (
      !unit ||
      /^(?:en|pour|au|dont|sur)$/i.test(unit) ||
      (request.kind === 'target' &&
        request.targets.some(
          (target) =>
            target.key === value.key &&
            (target.key === unit || target.labels.includes(unit))
        ))
    )
      return true;
    if (request.kind === 'observation')
      return value.unit === unit && this.acceptsUnit(request, value, unit);
    return (
      this.acceptsUnit(request, value, unit) &&
      (value.unit === null || this.acceptsUnit(request, value, value.unit))
    );
  }

  private static acceptsUnit(
    request: ElectrificationValueRequest,
    value: InterpretedValue,
    unit: string
  ): boolean {
    if (request.kind === 'observation')
      return request.unit === null || unit === request.unit;
    const target = request.targets.find(({ key }) => key === value.key);
    return !!target && [target.unit, ...target.units].includes(unit);
  }

  private static numbers(text: string): string[] {
    return [...text.matchAll(numberLiteralPattern)].map(([number]) =>
      Values.numericLiteral(number)
    );
  }
}
