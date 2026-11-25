import { electrificationEngagementMatching } from '@tet/backend/plans/plans/electrification/config/electrification-engagements-document.config';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationExtractionCheckpoint } from './electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';

/** Applique la politique courante aux rapprochements conservés, sans rappeler l'IA. */
export class ElectrificationEngagementMatchingRules {
  static report(
    checkpoint: ElectrificationExtractionCheckpoint,
    catalogue: ElectrificationConfig
  ): Result<ElectrificationIssue[], ElectrificationIssue[]> {
    const issues: ElectrificationIssue[] = [];
    for (const interpretation of checkpoint.engagementInterpretations) {
      const source = checkpoint.sources.find(
        ({ id }) => id === interpretation.sourceId
      );
      const definition = catalogue.engagements.find(
        ({ code }) => code === interpretation.code
      );
      if (!source || !definition || source.text !== interpretation.quote)
        return failure([
          Errors.issue('INCOMPATIBLE_ELECTRIFICATION_CHECKPOINT'),
        ]);

      const code =
        interpretation.match === 'scope-difference'
          ? electrificationEngagementMatching.allowScopeDifferences
            ? 'TOLERATED_ELECTRIFICATION_ENGAGEMENT_SCOPE'
            : 'UNTOLERATED_ELECTRIFICATION_ENGAGEMENT_SCOPE'
          : 'INTERPRETED_ELECTRIFICATION_ENGAGEMENT';
      issues.push(Errors.engagementMatch(code, source, definition));
    }
    const errors = issues.filter(({ kind }) => kind !== 'warning');
    return errors.length ? failure(errors) : success(issues);
  }
}
