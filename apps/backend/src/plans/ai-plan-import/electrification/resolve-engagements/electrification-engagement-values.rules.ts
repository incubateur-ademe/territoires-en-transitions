import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationEngagementsErrors as Errors } from './electrification-engagements.errors';

type Engagement = ElectrificationConfig['engagements'][number];
type TargetValue = { key: string; valeur: number | null; location?: string };

/** Contrôles communs à la lecture du Word et à la résolution d'un checkpoint. */
export class ElectrificationEngagementValuesRules {
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
        issues.push(
          Errors.outOfBounds(
            {
              value: extracted.valeur,
              unit,
              minimum: rules.minimum,
              maximum: rules.maximum,
            },
            extracted.location
          )
        );
      }
      const plafond = values.find(({ key }) => key === rules.plafondCible);
      if (plafond?.valeur != null && extracted.valeur > plafond.valeur) {
        const parent = definition.cibles.find(({ key }) => key === plafond.key);
        issues.push(
          Errors.inconsistentTargets(
            {
              value: extracted.valeur,
              unit,
              ceilingLabel: parent?.libelleSource ?? plafond.key,
              ceilingValue: plafond.valeur,
            },
            extracted.location
          )
        );
      }
    }
    return issues;
  }
}
