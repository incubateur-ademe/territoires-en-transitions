import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationDocumentValues as Values } from './electrification-document-values.rules';

type Target = ElectrificationConfig['engagements'][number]['cibles'][number];
const number = `(${Values.NUMBER_LITERAL})`;
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Grammaire des cellules simples ; les identités, unités et années viennent du catalogue. */
export class ElectrificationTargetValuesRules {
  static parse(text: string, targets: Target[]): Map<string, number> | null {
    text = text
      .normalize('NFKC')
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return new Map();
    if (targets.length === 1) {
      const value = this.parseOne(text, targets[0], false);
      return value === null ? null : new Map([[targets[0].key, value]]);
    }
    // "X dont Y" exprime une inclusion déjà déclarée dans les règles publiées.
    const included = targets.filter(
      (target) => target.reglesImport?.plafondCible
    );
    const parts = text.split(/\s+dont\s+/i);
    if (targets.length === 2 && included.length === 1 && parts.length === 2) {
      const child = included[0];
      const parent = targets.find(
        ({ key }) => key === child.reglesImport?.plafondCible
      );
      if (!parent) return null;
      const total = this.parseOne(parts[0], parent, false);
      const value = this.parseOne(parts[1], child, true);
      return total === null || value === null
        ? null
        : new Map([
            [parent.key, total],
            [child.key, value],
          ]);
    }
    const result = new Map<string, number>();
    for (const part of text.split(/\s*;\s*/)) {
      const matches = targets.flatMap((target) => {
        const value = this.parseOne(part, target, true);
        return value === null ? [] : [{ key: target.key, value }];
      });
      if (matches.length !== 1 || result.has(matches[0].key)) return null;
      result.set(matches[0].key, matches[0].value);
    }
    return result;
  }

  private static parseOne(
    text: string,
    target: Target,
    requireLabel: boolean
  ): number | null {
    if (!target.reglesImport || !target.uniteImport) return null;
    const rules = target.reglesImport;
    const units = [...new Set([target.uniteImport, ...rules.unites])]
      .map(escape)
      .join('|');
    const labels = [target.key, ...rules.libelles].map(escape).join('|');
    const quantity = `${number}(?:\\s*(?:${units}))?`;
    const year = `(?:\\s+(?:en|d'ici)\\s+${rules.annee})?`;
    // Les unités restent sensibles à la casse (MWh n'est pas mWh).
    const patterns = [
      `^(?:${labels})\\s*:\\s*${quantity}${year}$`,
      `^${quantity}\\s+(?:${labels})${year}$`,
      ...(requireLabel ? [] : [`^${quantity}${year}$`]),
    ];
    for (const pattern of patterns) {
      const match = text.match(new RegExp(pattern, 'u'));
      if (match) return Values.number(match[1]);
    }
    return null;
  }
}
