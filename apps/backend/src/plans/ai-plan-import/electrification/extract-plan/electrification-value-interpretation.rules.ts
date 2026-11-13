import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import {
  ElectrificationValueContext,
  ElectrificationValueRequest,
  ElectrificationValueResponse,
} from './electrification-value-interpretation.schema';

type InterpretedValue = ElectrificationValueResponse['values'][number];
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
    // Une même année peut qualifier plusieurs valeurs ; sa présence est vérifiée sans l'inventer.
    const sourceNumbers = this.numbers(text);
    for (const year of years) {
      const count = sourceNumbers.filter((number) => number === year).length;
      expectedNumbers.push(...Array<string>(count).fill(year));
    }
    return (
      JSON.stringify(sourceNumbers.sort()) ===
      JSON.stringify(expectedNumbers.sort())
    );
  }

  static normalize(
    request: ElectrificationValueRequest,
    values: InterpretedValue[]
  ): string | null {
    if (
      !this.isCandidate(request) ||
      !this.hasEvidence(request.source.text, values) ||
      values.some(
        (value) =>
          !(request.keys as readonly string[]).includes(value.key) ||
          (value.year !== null &&
            request.year !== null &&
            Number(value.year) !== request.year) ||
          !this.preservesUnit(request, value) ||
          (value.unit !== null &&
            request.unit !== null &&
            !this.sameUnit(value.unit, request.unit))
      )
    )
      return null;
    if (request.kind === 'observation') {
      if (values.length !== 1) return null;
      const value = values[0];
      if (request.year === null && value.year === null) return null;
      return `${value.number}${value.unit ? ` ${value.unit}` : ''}${
        value.year ? ` (${value.year})` : ''
      }`;
    }
    if (request.keys.includes('principale')) {
      return values.length === 1 ? values[0].number : null;
    }
    const total = values.find(({ key }) => key === 'total');
    const rapides = values.find(({ key }) => key === 'rapides');
    const totalValue = total ? Values.number(total.number) : null;
    const rapidesValue = rapides ? Values.number(rapides.number) : null;
    if (
      totalValue !== null &&
      rapidesValue !== null &&
      rapidesValue > totalValue
    )
      return null;
    // Les clés ne peuvent pas être déduites de deux nombres dépourvus de qualificatifs.
    if (
      (total && !/\b(?:total|publiques)\b/i.test(total.quote)) ||
      (rapides && !/\brapides?\b/i.test(rapides.quote))
    )
      return null;
    return [total, rapides]
      .filter((value) => value !== undefined)
      .map(({ key, number }) => `${key}: ${number}`)
      .join('; ');
  }

  /** Une citation tronquée ne doit pas faire disparaître l'unité accolée au nombre. */
  private static preservesUnit(
    request: ElectrificationValueRequest,
    value: InterpretedValue
  ): boolean {
    const number = [...value.quote.matchAll(numberLiteralPattern)].find(
      ([literal]) =>
        Values.numericLiteral(literal) === Values.numericLiteral(value.number)
    );
    if (!number) return false;
    const end =
      request.source.text.indexOf(value.quote) +
      number.index +
      number[0].length;
    const unit = request.source.text
      .slice(end)
      .match(/^\s*(%|[\p{L}€°][\p{L}\d%²³/._-]*)/u)?.[1];
    // Ces mots relient une quantité à son contexte ; ils ne sont pas des unités.
    if (!unit || /^(?:en|pour|au|dont|sur|rapides?|total)$/i.test(unit))
      return true;
    const expected =
      value.unit ?? (request.kind === 'target' ? request.unit : null);
    return expected !== null && this.sameUnit(unit, expected);
  }

  private static sameUnit(actual: string, expected: string): boolean {
    if (actual === expected) return true;
    const normalize = (unit: string) =>
      Values.normalize(unit).replace(/s\b/g, '');
    if (expected === 'Nombre') return normalize(actual) === 'artisan';
    if (expected === 'Nombre de bornes') return normalize(actual) === 'borne';
    // La casse est signifiante pour les symboles (MWh et mWh, par exemple).
    return actual === expected;
  }

  private static numbers(text: string): string[] {
    return [...text.matchAll(numberLiteralPattern)].map(([number]) =>
      Values.numericLiteral(number)
    );
  }
}
