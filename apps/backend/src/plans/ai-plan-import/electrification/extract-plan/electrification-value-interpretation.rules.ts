import { escapeRegExp } from 'es-toolkit';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';
import {
  ElectrificationInterpretedValue,
  ElectrificationValueContext,
  ElectrificationValueInterpretation,
  ElectrificationValueRequest,
} from './electrification-value-interpretation.schema';

type InterpretedValues = Omit<ElectrificationValueInterpretation, 'sourceId'>;

const numberLiteralPattern = new RegExp(
  `(?<![\\p{L}\\p{N}])${Values.NUMBER_LITERAL}(?:[eE][+-]?\\d+)?(?!\\p{N})`,
  'gu'
);
const literalPattern = new RegExp(
  `^(${Values.NUMBER_LITERAL})(?:\\s+(${Values.UNIT_TOKEN})|\\s*(%))?(?:\\s*\\((\\d{4})\\))?$`,
  'u'
);

/** Lit les quantités explicites et vérifie les preuves des interprétations restantes. */
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
      // Un mot après le nombre peut être une réserve. Seule une unité déclarée
      // permet de rester déterministe ; le texte libre passe par l'assistance.
      const units =
        request.kind === 'target'
          ? request.targets.flatMap(({ unit, units }) => [unit, ...units])
          : [request.unit];
      if (result.unit === null || units.includes(result.unit))
        return this.accepts(request, result) ? [result] : null;
    }
    if (request.kind === 'target') {
      const labelled = this.readLabelledTargets(request);
      if (labelled !== null) return labelled;
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

  /** Les libellés et la relation total/sous-ensemble viennent du catalogue publié. */
  private static readLabelledTargets(
    request: Extract<ElectrificationValueRequest, { kind: 'target' }>
  ): ElectrificationInterpretedValue[] | null {
    const text = request.source.text.trim();
    const included = text.split(/\s+dont\s+/iu);
    const parts = included.length === 2 ? included : text.split(/\s*;\s*/u);
    if (included.length > 2) return null;
    const result: ElectrificationInterpretedValue[] = [];
    for (const part of parts) {
      const match = part.match(
        new RegExp(
          `^(?:([^:;]+):\\s*(${Values.NUMBER_LITERAL})|(${Values.NUMBER_LITERAL})\\s+([^:;]+?))(?:\\s*\\((\\d{4})\\))?$`,
          'u'
        )
      );
      if (!match) return null;
      const value = Values.number(match[2] ?? match[3]);
      if (value === null) return null;
      const label = Values.normalize(match[1] ?? match[4]);
      const candidates = request.targets.filter((target) => {
        const labels = [target.key, ...target.labels];
        const units = [target.unit, ...target.units];
        const names = [
          ...labels,
          ...units.flatMap((unit) => labels.map((name) => `${unit} ${name}`)),
        ];
        // "100 bornes dont 20 rapides" : l'unité seule identifie le total
        // uniquement si la relation d'inclusion est confirmée ensuite.
        if (included.length === 2 && result.length === 0) names.push(...units);
        return names.some((name) => Values.normalize(name) === label);
      });
      // Une unité commune seule ne désigne pas la sous-cible. Le parent est
      // identifiable par la relation publiée, sans supposer l'ordre du catalogue.
      const matches =
        candidates.length > 1 && included.length === 2 && result.length === 0
          ? candidates.filter((candidate) =>
              request.targets.some(
                (target) => target.ceilingKey === candidate.key
              )
            )
          : candidates;
      if (matches.length !== 1) return null;
      const target = matches[0];
      const quantity = {
        key: target.key,
        value,
        unit: null,
        year: match[5] ? Number(match[5]) : null,
      };
      if (
        result.some(({ key }) => key === target.key) ||
        !this.accepts(request, quantity)
      )
        return null;
      result.push(quantity);
    }
    if (
      included.length === 2 &&
      request.targets.find(({ key }) => key === result[1].key)?.ceilingKey !==
        result[0].key
    )
      return null;
    return result;
  }

  /** Chaque quantité a son occurrence ; une échéance commune peut être partagée. */
  static hasEvidence(text: string, response: InterpretedValues): boolean {
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
    response: InterpretedValues
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
