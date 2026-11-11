import { ElectrificationDataService } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.service';
import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { ReadDocument } from '../../pipeline/document/document-page';
import { electrificationEngagementsErrors } from '../resolve-engagements/electrification-engagements.errors';
import { ElectrificationIssue } from '../electrification-issue';
import {
  ResolvedElectrificationFiches,
  resolveElectrificationFichesInputSchema,
} from '../resolve-fiches/electrification-fiches.schema';
import { ResolveElectrificationFichesService } from '../resolve-fiches/resolve-electrification-fiches.service';
import {
  ElectrificationExtractionCheckpoint,
  electrificationExtractionCheckpointSchema,
} from './electrification-extraction-checkpoint.schema';
import { ElectrificationExtractionErrors as Errors } from './electrification-extraction.errors';
import { ElectrificationExtractionRules } from './electrification-extraction.rules';
import { InterpretElectrificationValues } from './interpret-electrification-values';
import { LlmService } from '@tet/backend/utils/llm/llm.service';

type PrepareInput = {
  collectiviteId: number;
  catalogueVersion: string;
  onCheckpoint?: (
    checkpoint: ElectrificationExtractionCheckpoint
  ) => Promise<void>;
  signal?: AbortSignal;
} & (
  | { document: ReadDocument; resumeFrom?: never }
  | { document?: never; resumeFrom: unknown }
);

/** Préparation sans écriture métier, réutilisée à la reprise et avant persistance. */
@Injectable()
export class PrepareElectrificationImportService {
  constructor(
    private readonly data: ElectrificationDataService,
    private readonly resolver: ResolveElectrificationFichesService,
    private readonly permissions: PermissionService,
    private readonly llm: LlmService
  ) {}

  async prepare(
    input: PrepareInput,
    context: ServiceSecondArg
  ): Promise<
    Result<
      {
        checkpoint: ElectrificationExtractionCheckpoint;
        prepared: ResolvedElectrificationFiches;
      },
      ElectrificationIssue[]
    >
  > {
    if (
      typeof input.catalogueVersion !== 'string' ||
      !input.catalogueVersion.trim() ||
      !resolveElectrificationFichesInputSchema.shape.collectiviteId.safeParse(
        input.collectiviteId
      ).success
    ) {
      return failure([
        {
          code: 'INVALID_ELECTRIFICATION_INPUT',
          ...electrificationEngagementsErrors.INVALID_ELECTRIFICATION_INPUT,
        },
      ]);
    }
    // Vérifier avant la lecture ; le résolveur revérifie aussi au moment
    // de lire les objets TeT, notamment lors d'une reprise.
    const permission = await this.permissions.isAllowed(
      context.user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId }
    );
    if (!permission.success)
      return failure([
        {
          code: 'UNAUTHORIZED',
          ...electrificationEngagementsErrors.UNAUTHORIZED,
        },
      ]);
    const catalogue = await this.data.getCatalogue(input.catalogueVersion);
    if (!catalogue.success)
      return failure([
        {
          code: 'UNSUPPORTED_ELECTRIFICATION_CATALOGUE',
          ...electrificationEngagementsErrors.UNSUPPORTED_ELECTRIFICATION_CATALOGUE,
        },
      ]);
    let checkpoint: ElectrificationExtractionCheckpoint;
    if (input.document) {
      const extraction = await InterpretElectrificationValues.run({
        llm: this.llm,
        document: input.document,
        catalogue: catalogue.data,
        signal: input.signal,
      });
      if (!extraction.success) return extraction;
      checkpoint = extraction.data;
    } else {
      const parsed = electrificationExtractionCheckpointSchema.safeParse(
        input.resumeFrom
      );
      if (
        !parsed.success ||
        parsed.data.catalogueVersion !== catalogue.data.version
      ) {
        return failure([
          Errors.issue('INCOMPATIBLE_ELECTRIFICATION_CHECKPOINT'),
        ]);
      }
      checkpoint = parsed.data;
    }
    const draft = ElectrificationExtractionRules.adapt(
      checkpoint.response,
      checkpoint.sources
    );
    if (!draft.success) return draft;
    // La reprise résout à nouveau les références à partir du brouillon conservé.
    await input.onCheckpoint?.(checkpoint);
    const resolved = await this.resolver.resolve(
      {
        ...draft.data,
        collectiviteId: input.collectiviteId,
        catalogueVersion: catalogue.data.version,
      },
      context
    );
    return resolved.success
      ? success({ checkpoint, prepared: resolved.data })
      : resolved;
  }
}
