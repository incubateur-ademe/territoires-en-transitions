import { parseDateValue } from '../../pipeline/analyze-workbook/profile-columns';
import { ElectrificationDocumentSource } from './electrification-extraction.schema';
import { z } from 'zod';

/** Conversions explicites du formulaire, sans interprétation du texte libre. */
export class ElectrificationDocumentValues {
  static normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  static text(
    source: ElectrificationDocumentSource,
    placeholder?: string
  ): string | null {
    const text = source.text.trim();
    return !text ||
      (placeholder !== undefined &&
        this.normalize(text) === this.normalize(placeholder))
      ? null
      : text;
  }

  /**
   * Motif d'un nombre : séparateurs de milliers fins ou insécables et décimale
   * `.` ou `,`. Partagé par les lecteurs de valeurs pour éviter sa réécriture.
   */
  static readonly NUMBER_LITERAL =
    '[+-]?(?:\\d{1,3}(?:[ \\u00a0\\u202f]\\d{3})+|\\d+)(?:[.,]\\d+)?';

  /** Grammaire d'une unité : `%` seul, ou un symbole/lettre suivi de son suffixe. */
  static readonly UNIT_TOKEN = '%|[\\p{L}€°][\\p{L}\\d%²³/._-]*';

  /** Supprime les séparateurs de milliers et uniformise la décimale en `.`. */
  static numericLiteral(value: string): string {
    return value.replace(/[ \u00a0\u202f]/g, '').replace(',', '.');
  }

  /** Vrai si la chaîne entière est une unité reconnue par le canevas. */
  static isUnit(value: string): boolean {
    return new RegExp(`^(?:${this.UNIT_TOKEN})$`, 'u').test(value);
  }

  static number(text: string): number | null {
    const value = text.trim();
    if (!new RegExp(`^${this.NUMBER_LITERAL}$`).test(value)) return null;
    const number = Number(this.numericLiteral(value));
    return Number.isFinite(number) ? number : null;
  }

  static date(text: string): string | null {
    const months = [
      'janvier',
      'fevrier',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'aout',
      'septembre',
      'octobre',
      'novembre',
      'decembre',
    ];
    const normalized = this.normalize(text);
    const numeric = normalized.match(/^(\d{1,2})\/(\d{4})$/);
    const named = normalized.match(/^(\p{L}+)\s+(\d{4})$/u);
    const month = numeric
      ? Number(numeric[1])
      : named
      ? months.indexOf(named[1]) + 1
      : 0;
    const year = numeric?.[2] ?? named?.[2];
    // Convention de stockage validée pour le canevas : mois/année -> premier jour.
    const date =
      parseDateValue(text) ??
      (month > 0 && year
        ? `${year}-${String(month).padStart(2, '0')}-01`
        : null);
    return date !== null && z.iso.date().safeParse(date).success ? date : null;
  }

  static reference(
    source: ElectrificationDocumentSource,
    placeholder?: string
  ) {
    const value = this.text(source, placeholder);
    if (source.links.length) return { sourceId: source.id, value };
    return { sourceId: value === null ? null : source.id, value };
  }

  /** Les séparateurs explicites gardent les noms composés et leur ponctuation. */
  static names(text: string | null): string[] | null {
    return text === null
      ? null
      : text
          .split(/[;\n]/)
          .map((value) => value.trim())
          .filter(Boolean);
  }
}
