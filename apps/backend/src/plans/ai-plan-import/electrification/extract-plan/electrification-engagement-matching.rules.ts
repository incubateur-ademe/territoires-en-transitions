import { electrificationEngagementMatching } from '@tet/backend/plans/plans/electrification/config/electrification-engagements-document.config';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationExtractionCheckpoint } from './electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  electrificationEngagementComparisonSchema,
  ElectrificationEngagementInterpretation,
  ElectrificationEngagementMatchRequest,
} from './electrification-engagement-interpretation.schema';

/** Valide les comparaisons IA et applique la politique aux rapprochements retenus. */
export class ElectrificationEngagementMatchingRules {
  static interpret(
    request: ElectrificationEngagementMatchRequest,
    response: unknown
  ): Result<ElectrificationEngagementInterpretation, ElectrificationIssue[]> {
    const comparison =
      electrificationEngagementComparisonSchema.safeParse(response);
    const candidate = comparison.success
      ? request.candidates.find(({ code }) => code === comparison.data.code)
      : undefined;
    if (
      !comparison.success ||
      comparison.data.quote !== request.source.text ||
      (comparison.data.code !== null && !candidate)
    )
      return failure([
        Errors.issue(
          'AI_ENGAGEMENT_INTERPRETATION_FAILED',
          request.source.location
        ),
      ]);

    const { code, quote, action, objectives } = comparison.data;
    if (
      code === null ||
      action !== 'same-outcome' ||
      objectives !== 'compatible'
    )
      return failure([
        Errors.issue(
          'INVALID_ELECTRIFICATION_ENGAGEMENT',
          request.source.location
        ),
      ]);

    return success({
      sourceId: request.source.id,
      code,
      quote,
      match: 'review-required',
    });
  }

  /** Réapplique la politique au checkpoint sans nouvel appel au modèle. */
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

      const code = electrificationEngagementMatching.allowInterpretedEngagements
        ? 'INTERPRETED_ELECTRIFICATION_ENGAGEMENT'
        : 'UNTOLERATED_ELECTRIFICATION_ENGAGEMENT';
      issues.push(Errors.engagementMatch(code, source, definition));
    }
    const errors = issues.filter(({ kind }) => kind !== 'warning');
    return errors.length ? failure(errors) : success(issues);
  }
}
