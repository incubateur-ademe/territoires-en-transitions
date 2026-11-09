import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig } from '@tet/domain/plans';
import { AiPlanImportProfileEnum } from '../../models/import-profile';
import { ReadDocument } from '../../pipeline/document/document-page';
import { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';
import { electrificationDocumentTemplate } from './electrification-document-template.constants';
import { ElectrificationDocumentRules } from './electrification-document.rules';
import { ElectrificationEngagementsDocumentRules } from './electrification-engagements-document.rules';
import {
  ELECTRIFICATION_CHECKPOINT_VERSION,
  ElectrificationExtractionCheckpoint,
} from './electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionRules } from './electrification-extraction.rules';
import { ElectrificationExtractionResponse } from './electrification-extraction.schema';
import { ElectrificationFichesDocumentRules } from './electrification-fiches-document.rules';
import { ElectrificationValueContext } from './electrification-value-interpretation.schema';

/** Lecture déterministe du canevas officiel ; aucun accès à la base ni au modèle. */
export class ExtractElectrificationPlan {
  static run({
    document,
    catalogue,
    signal,
    valueContext,
  }: {
    document: ReadDocument;
    catalogue: ElectrificationConfig;
    signal?: AbortSignal;
    valueContext?: ElectrificationValueContext;
  }): Result<ElectrificationExtractionCheckpoint, ElectrificationIssue[]> {
    signal?.throwIfAborted();
    const selected = ElectrificationDocumentRules.read(document);
    if (!selected.success) return selected;
    const response: ElectrificationExtractionResponse = {
      engagements: [],
      axes: [],
      fiches: [],
    };
    const issues: ElectrificationIssue[] = [];
    for (const table of selected.data.tables) {
      if (table.section === 'A') {
        const engagements = ElectrificationEngagementsDocumentRules.parse(
          table.rows,
          catalogue,
          valueContext
        );
        if (!engagements.success) issues.push(...engagements.error);
        else response.engagements.push(...engagements.data);
      } else {
        const fiche = ElectrificationFichesDocumentRules.parse(
          table.rows,
          catalogue,
          valueContext
        );
        if (!fiche.success) issues.push(...fiche.error);
        else if (fiche.data) {
          response.axes.push(fiche.data.axe);
          response.fiches.push(fiche.data.fiche);
        }
      }
    }
    if (issues.length) return failure(issues);
    const draft = ElectrificationExtractionRules.adapt(
      response,
      selected.data.sources
    );
    if (!draft.success) return draft;
    return success({
      profile: AiPlanImportProfileEnum.ELECTRIFICATION,
      schemaVersion: ELECTRIFICATION_CHECKPOINT_VERSION,
      templateVersion: electrificationDocumentTemplate.version,
      catalogueVersion: catalogue.version,
      documentKind: 'docx',
      response,
      sources: selected.data.sources,
      interpretations: valueContext?.interpretations ?? [],
      tokens: emptyTokenUsage(),
    });
  }
}
