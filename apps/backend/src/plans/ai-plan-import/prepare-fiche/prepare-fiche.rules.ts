import { failure, Result, success } from '@tet/backend/utils/result.type';
import { FicheImportRules } from '@tet/domain/plans';
import { ImportReport } from '../models/import-report';
import { PrepareFicheErrors as Errors } from './prepare-fiche.errors';
import {
  PrepareFicheInput,
  PreparedFicheCreate,
  PreparedSousAction,
} from './prepare-fiche.schema';

/**
 * Préparation pure après validation des champs et clés de source, puis résolution
 * des références. Aucune lecture ou écriture métier.
 */
export class PrepareFicheRules {
  static prepare(
    input: PrepareFicheInput
  ): Result<PreparedFicheCreate, ImportReport['issues']> {
    const champs = FicheImportRules.mergeFields(input.defaults, input.champs);
    const issues = FicheImportRules.validateFields(champs).map((code) =>
      Errors.issue(code, input.source.location)
    );
    const sousActions: PreparedSousAction[] = [];
    const seen = new Set<string>();
    for (const item of input.sousActions) {
      if (item.code !== null) {
        if (seen.has(item.code))
          issues.push(
            Errors.issue('DUPLICATE_FICHE_REFERENCE', item.source.location)
          );
        seen.add(item.code);
      }
      const champs = FicheImportRules.mergeFields(item.defaults, item.champs);
      issues.push(
        ...FicheImportRules.validateFields(champs).map((code) =>
          Errors.issue(code, item.source.location)
        )
      );
      sousActions.push({
        key: `fiche:${item.source.key}`,
        code: item.code,
        champs,
        source: item.source,
      });
    }
    const complementCodes = new Set<string>();
    for (const item of input.complements) {
      if (complementCodes.has(item.code)) {
        issues.push(
          Errors.issue('INVALID_FICHE_DEFAULTS', input.source.location)
        );
        continue;
      }
      complementCodes.add(item.code);
      if (seen.has(item.code)) continue;
      if (FicheImportRules.validateFields(item.champs).length)
        issues.push(
          Errors.issue('INVALID_FICHE_DEFAULTS', input.source.location)
        );
      sousActions.push({
        key: `catalogue:${input.source.key}:${item.code}`,
        code: item.code,
        champs: { ...item.champs },
        source: input.source,
      });
    }
    if (issues.length) return failure(issues);
    return success({
      key: `fiche:${input.source.key}`,
      axeKey: input.axeKey,
      source: input.source,
      mode: 'create',
      code: input.code,
      champs,
      sousActions,
    });
  }
}
