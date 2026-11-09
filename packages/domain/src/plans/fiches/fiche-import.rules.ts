import { FicheImportFields } from './fiche-import.schema';

export type FicheImportFieldError =
  | 'MISSING_FICHE_TITLE'
  | 'INVALID_FICHE_DATES';

export class FicheImportRules {
  static mergeFields(
    defaults: FicheImportFields,
    fields: FicheImportFields
  ): FicheImportFields {
    return {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(fields).filter(
          ([, value]) =>
            value != null && (!Array.isArray(value) || value.length > 0)
        )
      ),
    };
  }

  /** Les schémas d'entrée valident les dates avant ce contrôle de cohérence. */
  static validateFields(fields: {
    titre?: string | null;
    dateDebut?: string | Date | null;
    dateFin?: string | Date | null;
  }): FicheImportFieldError[] {
    const errors: FicheImportFieldError[] = [];
    if (!fields.titre?.trim()) errors.push('MISSING_FICHE_TITLE');
    if (fields.dateDebut && fields.dateFin) {
      const debut = this.toTimestamp(fields.dateDebut);
      const fin = this.toTimestamp(fields.dateFin);
      if (debut > fin) errors.push('INVALID_FICHE_DATES');
    }
    return errors;
  }

  private static toTimestamp(date: string | Date): number {
    return typeof date === 'string' ? Date.parse(date) : date.getTime();
  }
}
