import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { electrificationEngagementsIssue as issue } from './electrification-engagements.errors';

type Engagement = ElectrificationConfig['engagements'][number];
type TargetValue = { key: string; valeur: number | null; location?: string };

/** Contrôles communs à la lecture du Word et à la résolution d'un checkpoint. */
export class ElectrificationEngagementValuesRules {
  static duplicate(code: string, location?: string): ElectrificationIssue {
    return {
      ...issue('DUPLICATE_ENGAGEMENT', location),
      message: `L'engagement ${code} est sélectionné plusieurs fois. Gardez une seule ligne pour cet engagement.`,
    };
  }

  static validate(
    definition: Engagement,
    values: TargetValue[]
  ): ElectrificationIssue[] {
    const issues: ElectrificationIssue[] = [];
    for (const cible of definition.cibles) {
      const extracted = values.find(({ key }) => key === cible.key);
      if (extracted?.valeur == null) continue;
      const rules = cible.reglesImport;
      const unit = cible.uniteImport;
      if (
        (rules.minimum !== null && extracted.valeur < rules.minimum) ||
        (rules.maximum !== null && extracted.valeur > rules.maximum)
      ) {
        const bounds =
          rules.minimum !== null && rules.maximum !== null
            ? `entre ${rules.minimum} et ${rules.maximum}`
            : rules.minimum !== null
            ? `supérieure ou égale à ${rules.minimum}`
            : `inférieure ou égale à ${rules.maximum}`;
        issues.push({
          ...issue('INVALID_ENGAGEMENT_VALUE', extracted.location),
          message: `Vous avez saisi ${extracted.valeur} ${unit}. Renseignez une valeur ${bounds} ${unit}.`,
        });
      }
      const plafond = values.find(({ key }) => key === rules.plafondCible);
      if (plafond?.valeur != null && extracted.valeur > plafond.valeur) {
        const parent = definition.cibles.find(({ key }) => key === plafond.key);
        issues.push({
          ...issue('INCONSISTENT_ENGAGEMENT_TARGETS', extracted.location),
          message: `La valeur saisie (${
            extracted.valeur
          } ${unit}) ne peut pas dépasser la cible "${
            parent?.libelleSource ?? plafond.key
          }" (${plafond.valeur} ${unit}).`,
        });
      }
    }
    return issues;
  }
}
