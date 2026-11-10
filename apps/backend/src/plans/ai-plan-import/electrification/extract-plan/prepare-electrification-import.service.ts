import { Inject, Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { electrificationConfigSchema } from '@tet/domain/plans';
import { ResourceType } from '@tet/domain/users';
import { ReadDocument } from '../../pipeline/document/document-page';
import { ELECTRIFICATION_CONFIG } from '../electrification.constants';
import { electrificationEngagementsErrors } from '../resolve-engagements/electrification-engagements.errors';
import { ElectrificationIssue } from '../resolve-engagements/electrification-engagements.schema';
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
    @Inject(ELECTRIFICATION_CONFIG) private readonly config: unknown,
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
    const catalogue = electrificationConfigSchema.safeParse(this.config);
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
