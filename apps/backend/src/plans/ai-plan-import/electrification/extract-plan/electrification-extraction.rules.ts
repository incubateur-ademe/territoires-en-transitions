import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationEngagementCodeEnum as EngagementCode } from '@tet/domain/plans';
import { escapeRegExp } from 'es-toolkit';
import type { ImportSource } from '../../models/import-source.schema';
import type { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import { electrificationDocumentTemplate } from './electrification-document-template.constants';
import {
  ElectrificationDocumentDraft,
  electrificationDocumentDraftSchema,
  ElectrificationDocumentSource,
  electrificationDocumentSourceSchema,
  ElectrificationExtractionResponse,
  electrificationExtractionResponseSchema,
} from './electrification-extraction.schema';

type AdaptContext = {
  byId: ReadonlyMap<string, ElectrificationDocumentSource>;
  issues: ElectrificationIssue[];
  axisKeys: Map<string, string>;
};

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
    const byId = new Map(registry.data.map((source) => [source.id, source]));
    if (byId.size !== registry.data.length)
      return failure([Errors.issue('INVALID_EXTRACTION_SOURCE')]);
    const ctx: AdaptContext = { byId, issues: [], axisKeys: new Map() };
    const draft: ElectrificationDocumentDraft = {
      engagements: this.adaptEngagements(ctx, parsed.data.engagements),
      axes: this.adaptAxes(ctx, parsed.data.axes, parsed.data.fiches),
      fiches: [],
    };
    draft.fiches = this.adaptFiches(ctx, parsed.data.fiches);
    if (!draft.engagements.length && !draft.fiches.length)
      ctx.issues.push(Errors.issue('INVALID_ELECTRIFICATION_DOCUMENT'));
    if (ctx.issues.length) return failure(ctx.issues);
    const validated = electrificationDocumentDraftSchema.safeParse(draft);
    return validated.success
      ? success(validated.data)
      : failure(
          validated.error.issues.map(({ path }) =>
            Errors.issue('INVALID_ELECTRIFICATION_EXTRACTION', path.join('.'))
          )
        );
  }

  private static source(
    { byId, issues }: AdaptContext,
    id: string,
    section: 'A' | 'B',
    key: string,
    location?: string
  ): ImportSource {
    const entry = byId.get(id);
    if (!entry || entry.section !== section)
      issues.push(Errors.issue('INVALID_EXTRACTION_SOURCE', entry?.location));
    return { key, location: location ?? entry?.location ?? id };
  }

  private static reference(
    ctx: AdaptContext,
    input: ElectrificationExtractionResponse['fiches'][number]['reference'],
    location: string
  ): string | null {
    const resolved = this.resolveReference(input, ctx.byId);
    if (!resolved.success) {
      ctx.issues.push({
        ...resolved.error,
        location: Locations.field(location, 'Code ou URL'),
      });
      return null;
    }
    return resolved.data;
  }

  private static adaptEngagements(
    ctx: AdaptContext,
    engagements: ElectrificationExtractionResponse['engagements']
  ): ElectrificationDocumentDraft['engagements'] {
    return engagements.map((engagement) => {
      const location = Locations.entity(
        'Engagement',
        ctx.byId.get(engagement.source)?.text,
        engagement.code
      );
      return {
        ...engagement,
        source: this.source(
          ctx,
          engagement.source,
          'A',
          `engagement:${engagement.source}:${engagement.code}`,
          location
        ),
        cibles: engagement.cibles.map((cible) => ({
          ...cible,
          // Le canevas compte des artisans ; le catalogue TeT utilise l'unité nb.
          unite:
            engagement.code === EngagementCode.ELECTRIFICATION_ARTISANS &&
            cible.key === 'principale' &&
            cible.unite === 'Nombre'
              ? 'nb'
              : cible.unite,
          source: this.source(
            ctx,
            cible.source,
            'A',
            `cible:${engagement.source}:${engagement.code}:${cible.source}:${cible.key}`,
            Locations.field(
              location,
              electrificationDocumentTemplate.engagements.columns.cible
            )
          ),
        })),
      };
    });
  }

  private static adaptAxes(
    ctx: AdaptContext,
    axes: ElectrificationExtractionResponse['axes'],
    fiches: ElectrificationExtractionResponse['fiches']
  ): ElectrificationDocumentDraft['axes'] {
    return axes.map((axe) => {
      const fiche = fiches.find(
        ({ axeSourceKey }) =>
          axeSourceKey === axe.source ||
          axe.sousAxes.some(({ source }) => source === axeSourceKey)
      );
      const actionLocation = Locations.entity(
        'Action',
        fiche?.champs.titre,
        ctx.byId.get(axe.source)?.location
      );
      const key = `axe:${axe.source}`;
      if (ctx.axisKeys.has(axe.source))
        ctx.issues.push(
          Errors.issue(
            'INVALID_EXTRACTION_PARENT',
            ctx.byId.get(axe.source)?.location
          )
        );
      ctx.axisKeys.set(axe.source, key);
      return {
        ...axe,
        source: this.source(
          ctx,
          axe.source,
          'B',
          key,
          Locations.field(
            actionLocation,
            Locations.axe(
              'Axe',
              axe.numero,
              axe.titre,
              ctx.byId.get(axe.source)?.location
            )
          )
        ),
        sousAxes: axe.sousAxes.map((sousAxe) => {
          const key = `sous-axe:${sousAxe.source}`;
          if (ctx.axisKeys.has(sousAxe.source))
            ctx.issues.push(
              Errors.issue(
                'INVALID_EXTRACTION_PARENT',
                ctx.byId.get(sousAxe.source)?.location
              )
            );
          ctx.axisKeys.set(sousAxe.source, key);
          return {
            ...sousAxe,
            source: this.source(
              ctx,
              sousAxe.source,
              'B',
              key,
              Locations.field(
                actionLocation,
                Locations.axe(
                  'Sous-axe',
                  sousAxe.numero,
                  sousAxe.titre,
                  ctx.byId.get(sousAxe.source)?.location
                )
              )
            ),
          };
        }),
      };
    });
  }

  private static adaptFiches(
    ctx: AdaptContext,
    fiches: ElectrificationExtractionResponse['fiches']
  ): ElectrificationDocumentDraft['fiches'] {
    return fiches.map((fiche) => {
      const location = Locations.entity(
        'Action',
        fiche.champs.titre,
        ctx.byId.get(fiche.source)?.location
      );
      const axeSourceKey = ctx.axisKeys.get(fiche.axeSourceKey);
      if (!axeSourceKey)
        ctx.issues.push(
          Errors.issue(
            'INVALID_EXTRACTION_PARENT',
            Locations.field(location, 'Axe')
          )
        );
      return {
        ...fiche,
        source: this.source(
          ctx,
          fiche.source,
          'B',
          `fiche:${fiche.source}`,
          location
        ),
        axeSourceKey: axeSourceKey ?? fiche.axeSourceKey,
        reference: this.reference(ctx, fiche.reference, location),
        sousActions: fiche.sousActions.map((child, index) => {
          const childLocation = Locations.field(
            location,
            Locations.entity(
              'Sous-action',
              child.champs.titre,
              ctx.byId.get(child.source)?.location
            )
          );
          return {
            ...child,
            source: this.source(
              ctx,
              child.source,
              'B',
              `sous-action:${fiche.source}:${child.source}:${index}`,
              childLocation
            ),
            reference: this.reference(ctx, child.reference, childLocation),
          };
        }),
        indicateurs: fiche.indicateurs.map((child, index) => {
          const childLocation = Locations.field(
            location,
            Locations.entity(
              'Indicateur',
              child.titre,
              ctx.byId.get(child.source)?.location
            )
          );
          return {
            ...child,
            source: this.source(
              ctx,
              child.source,
              'B',
              `indicateur:${fiche.source}:${child.source}:${index}`,
              childLocation
            ),
            reference: this.reference(ctx, child.reference, childLocation),
          };
        }),
      };
    });
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
