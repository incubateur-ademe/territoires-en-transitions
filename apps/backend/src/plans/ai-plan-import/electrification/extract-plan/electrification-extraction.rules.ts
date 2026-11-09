import { failure, Result, success } from '@tet/backend/utils/result.type';
import { escapeRegExp } from 'es-toolkit';
import type { ImportSource } from '../../models/import-source.schema';
import type { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import {
  ElectrificationDocumentDraft,
  electrificationDocumentDraftSchema,
  ElectrificationDocumentSource,
  electrificationDocumentSourceSchema,
  ElectrificationExtractionResponse,
  electrificationExtractionResponseSchema,
} from './electrification-extraction.schema';

/** Rattache les données extraites aux sources réelles avant toute résolution TeT. */
export class ElectrificationExtractionRules {
  static adapt(
    response: ElectrificationExtractionResponse,
    sources: ElectrificationDocumentSource[]
  ): Result<ElectrificationDocumentDraft, ElectrificationIssue[]> {
    const parsed = electrificationExtractionResponseSchema.safeParse(response);
    const registry = electrificationDocumentSourceSchema
      .array()
      .safeParse(sources);
    if (!parsed.success || !registry.success) {
      const errors = [parsed, registry].flatMap((result) =>
        result.success ? [] : result.error.issues
      );
      return failure(
        errors.map(({ path }) =>
          Errors.issue('INVALID_ELECTRIFICATION_EXTRACTION', path.join('.'))
        )
      );
    }
    const issues: ElectrificationIssue[] = [];
    const byId = new Map(registry.data.map((source) => [source.id, source]));
    if (byId.size !== registry.data.length)
      return failure([Errors.issue('INVALID_EXTRACTION_SOURCE')]);
    const source = (
      id: string,
      section: 'A' | 'B',
      key: string
    ): ImportSource => {
      const entry = byId.get(id);
      if (!entry || entry.section !== section)
        issues.push(Errors.issue('INVALID_EXTRACTION_SOURCE', entry?.location));
      return { key, location: entry?.location ?? id };
    };
    const reference = (
      input: ElectrificationExtractionResponse['fiches'][number]['reference']
    ): string | null => {
      const resolved = this.resolveReference(input, byId);
      if (!resolved.success) {
        issues.push(resolved.error);
        return null;
      }
      return resolved.data;
    };
    const axisKeys = new Map<string, string>();
    const draft: ElectrificationDocumentDraft = {
      engagements: parsed.data.engagements.map((engagement) => ({
        ...engagement,
        source: source(
          engagement.source,
          'A',
          `engagement:${engagement.source}:${engagement.code}`
        ),
        cibles: engagement.cibles.map((cible) => ({
          ...cible,
          source: source(
            cible.source,
            'A',
            `cible:${engagement.source}:${engagement.code}:${cible.source}:${cible.key}`
          ),
        })),
      })),
      axes: parsed.data.axes.map((axe) => {
        const key = `axe:${axe.source}`;
        if (axisKeys.has(axe.source))
          issues.push(
            Errors.issue(
              'INVALID_EXTRACTION_PARENT',
              byId.get(axe.source)?.location
            )
          );
        axisKeys.set(axe.source, key);
        return {
          ...axe,
          source: source(axe.source, 'B', key),
          sousAxes: axe.sousAxes.map((sousAxe) => {
            const key = `sous-axe:${sousAxe.source}`;
            if (axisKeys.has(sousAxe.source))
              issues.push(
                Errors.issue(
                  'INVALID_EXTRACTION_PARENT',
                  byId.get(sousAxe.source)?.location
                )
              );
            axisKeys.set(sousAxe.source, key);
            return { ...sousAxe, source: source(sousAxe.source, 'B', key) };
          }),
        };
      }),
      fiches: [],
    };
    draft.fiches = parsed.data.fiches.map((fiche) => {
      const axeSourceKey = axisKeys.get(fiche.axeSourceKey);
      if (!axeSourceKey)
        issues.push(
          Errors.issue(
            'INVALID_EXTRACTION_PARENT',
            byId.get(fiche.source)?.location
          )
        );
      return {
        ...fiche,
        source: source(fiche.source, 'B', `fiche:${fiche.source}`),
        axeSourceKey: axeSourceKey ?? fiche.axeSourceKey,
        reference: reference(fiche.reference),
        sousActions: fiche.sousActions.map((child, index) => ({
          ...child,
          source: source(
            child.source,
            'B',
            `sous-action:${fiche.source}:${child.source}:${index}`
          ),
          reference: reference(child.reference),
        })),
        indicateurs: fiche.indicateurs.map((child, index) => ({
          ...child,
          source: source(
            child.source,
            'B',
            `indicateur:${fiche.source}:${child.source}:${index}`
          ),
          reference: reference(child.reference),
        })),
      };
    });
    if (!draft.engagements.length && !draft.fiches.length)
      issues.push(Errors.issue('INVALID_ELECTRIFICATION_DOCUMENT'));
    if (issues.length) return failure(issues);
    const validated = electrificationDocumentDraftSchema.safeParse(draft);
    return validated.success
      ? success(validated.data)
      : failure(
          validated.error.issues.map(({ path }) =>
            Errors.issue('INVALID_ELECTRIFICATION_EXTRACTION', path.join('.'))
          )
        );
  }

  private static resolveReference(
    input: ElectrificationExtractionResponse['fiches'][number]['reference'],
    sources: ReadonlyMap<string, ElectrificationDocumentSource>
  ): Result<string | null, ElectrificationIssue> {
    if (input.sourceId === null)
      return input.value === null
        ? success(null)
        : failure(Errors.issue('INVALID_EXTRACTION_REFERENCE'));
    const source = sources.get(input.sourceId);
    if (!source || source.section !== 'B')
      return failure(
        Errors.issue('INVALID_EXTRACTION_SOURCE', source?.location)
      );
    if (source.links.some((link) => link.target === null))
      return failure(
        Errors.issue('UNREADABLE_EXTRACTION_REFERENCE', source.location)
      );
    const targets = [...new Set(source.links.map((link) => link.target))];
    if (targets.length > 1)
      return failure(
        Errors.issue('CONFLICTING_EXTRACTION_REFERENCES', source.location)
      );
    const target = targets[0];
    if (target) {
      if (
        input.value !== null &&
        input.value !== target &&
        !source.links.some((link) => link.text.trim() === input.value)
      )
        return failure(
          Errors.issue('CONFLICTING_EXTRACTION_REFERENCES', source.location)
        );
      return success(target);
    }
    // Ne pas accepter "A-1" comme preuve lorsque le document porte "A-10".
    const codeBoundary = '[^\\p{L}\\p{N}_./-]';
    if (
      input.value === null ||
      !new RegExp(
        `(?:^|${codeBoundary})${escapeRegExp(
          input.value
        )}(?:$|${codeBoundary})`,
        'u'
      ).test(source.text)
    )
      return failure(
        Errors.issue('INVALID_EXTRACTION_REFERENCE', source.location)
      );
    return success(input.value);
  }
}
