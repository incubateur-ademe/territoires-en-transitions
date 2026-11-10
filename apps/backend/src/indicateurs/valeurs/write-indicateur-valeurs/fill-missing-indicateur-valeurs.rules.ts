import {
  IndicateurPeriodiciteEnum,
  IndicateurValeur,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { IndicateurValeursRules } from '../indicateur-valeurs.rules';

const fields = [
  'resultat',
  'objectif',
  'resultatCommentaire',
  'objectifCommentaire',
  'estimation',
] as const;

export type IndicateurValeurConflict = Pick<
  IndicateurValeur,
  | 'collectiviteId'
  | 'indicateurId'
  | 'dateValeur'
  | 'periodicite'
  | 'metadonneeId'
> & {
  field: (typeof fields)[number];
  existingValue: number | string;
  incomingValue: number | string;
};

/** Complète les cellules nulles ; les lignes conservées ne sont jamais renormalisées. */
export class FillMissingIndicateurValeursRules {
  static merge(incoming: IndicateurValeurCreate[], stored: IndicateurValeur[]) {
    const byIdentity = new Map<string, IndicateurValeurCreate>(
      stored.map((valeur) => [
        IndicateurValeursRules.getIdentity(valeur),
        valeur,
      ])
    );
    const changed = new Set<string>();
    const conflits: IndicateurValeurConflict[] = [];
    for (const valeur of incoming) {
      const key = IndicateurValeursRules.getIdentity(valeur);
      const previous = byIdentity.get(key);
      const merged = { ...(previous ?? valeur) };
      let hasAddition = false;
      for (const field of fields) {
        const incomingValue = valeur[field];
        if (incomingValue == null) continue;
        const existingValue = previous?.[field];
        if (existingValue == null) {
          Object.assign(merged, { [field]: incomingValue });
          hasAddition = true;
        } else if (existingValue !== incomingValue) {
          conflits.push({
            collectiviteId: valeur.collectiviteId,
            indicateurId: valeur.indicateurId,
            dateValeur: valeur.dateValeur,
            periodicite:
              merged.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE,
            metadonneeId: merged.metadonneeId ?? null,
            field,
            existingValue,
            incomingValue,
          });
        }
      }
      if (!hasAddition) continue;
      // Une saisie complétée devient manuelle, comme dans les autres parcours.
      // Les valeurs conservées ne doivent pas être remplacées au prochain calcul.
      Object.assign(merged, {
        calculAuto: valeur.calculAuto,
        calculAutoIdentifiantsManquants: valeur.calculAutoIdentifiantsManquants,
        modifiedBy: valeur.modifiedBy,
      });
      byIdentity.set(key, merged);
      changed.add(key);
    }
    return {
      valeurs: [...byIdentity].flatMap(([key, valeur]) =>
        changed.has(key) ? [valeur] : []
      ),
      conflits,
    };
  }
}
