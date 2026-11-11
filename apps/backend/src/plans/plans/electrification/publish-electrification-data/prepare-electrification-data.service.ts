import { IndicateurReferenceExterneRepository } from '@tet/backend/indicateurs/indicateur/indicateur-reference-externe.repository';
import { electrificationGristConfig } from '../config/electrification-grist.config';
import { Injectable } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  ElectrificationLaureatsConfig,
} from '@tet/domain/plans';
import {
  ElectrificationDataContent,
  ElectrificationDataVersion,
} from './electrification-data-version.rules';
import { ElectrificationDataError } from './electrification-data.errors';
import { ElectrificationDataService } from './electrification-data.service';
import {
  ElectrificationDataIssue,
  ElectrificationDataKind,
  PrepareElectrificationDataInput,
} from './publish-electrification-data.input';
import { ElectrificationGristAdapter } from './sources/electrification-grist.adapter';
import { ReadElectrificationGristService } from './sources/read-electrification-grist.service';
import { ReadElectrificationLaureatsService } from './sources/read-electrification-laureats.service';
import { ValidateElectrificationDataService } from './validate-electrification-data.service';

type PreparedData = {
  data: ElectrificationConfig | ElectrificationLaureatsConfig;
  sourceRevision: string;
  excluded: number;
  valid: boolean;
  issues: ElectrificationDataIssue[];
};

@Injectable()
export class PrepareElectrificationDataService {
  constructor(
    private readonly data: ElectrificationDataService,
    private readonly references: IndicateurReferenceExterneRepository,
    private readonly catalogue: ReadElectrificationGristService,
    private readonly laureats: ReadElectrificationLaureatsService,
    private readonly validation: ValidateElectrificationDataService
  ) {}

  async prepare(
    input: PrepareElectrificationDataInput
  ): Promise<Result<PreparedData, ElectrificationDataError>> {
    const source = await this.readSource(input.kind);
    if (!source.success) return source;
    const content = source.data.data;
    return this.validate(input.kind, {
      ...source.data,
      data: this.withMetadata(content, input),
    });
  }

  async prepareForSync(kind: ElectrificationDataKind) {
    const source = await this.readSource(kind);
    if (!source.success) return source;
    const content = source.data.data;
    const candidate = await this.validate(kind, {
      ...source.data,
      data: this.withMetadata(content, {
        version: ElectrificationDataVersion.identify(content),
      }),
    });
    if (!candidate.success || !candidate.data.valid) return candidate;
    // Identifier le DTO validé, y compris les mappings TeT, sans les métadonnées de publication.
    candidate.data.data.version = ElectrificationDataVersion.identify(
      candidate.data.data
    );
    return candidate;
  }

  private withMetadata(
    content: ElectrificationDataContent,
    metadata: { version: string; validFrom?: string }
  ): PreparedData['data'] {
    return 'laureats' in content
      ? {
          ...content,
          version: metadata.version,
          validFrom: metadata.validFrom ?? new Date().toISOString(),
        }
      : { ...content, version: metadata.version };
  }

  private async readSource(kind: ElectrificationDataKind) {
    return kind === 'laureats' ? this.laureats.read() : this.readCatalogue();
  }

  private async validate(
    kind: ElectrificationDataKind,
    candidate: {
      data: PreparedData['data'];
      revision: string;
      excluded: number;
    }
  ): Promise<Result<PreparedData, ElectrificationDataError>> {
    try {
      const checked = await this.validation.validate({
        kind,
        data: candidate.data,
      });
      return success({
        data: checked.success ? checked.data.data : candidate.data,
        sourceRevision: candidate.revision,
        excluded: candidate.excluded,
        valid: checked.success,
        issues: checked.success ? [] : checked.error,
      });
    } catch {
      return failure('DATABASE_ERROR');
    }
  }

  private async readCatalogue() {
    const current = await this.data.getCatalogue();
    if (!current.success && current.error !== 'DATA_UNAVAILABLE')
      return current;
    let references;
    const { indicateurReferenceSource, engagementReferenceSource } =
      electrificationGristConfig.catalogue;
    try {
      references = await this.references.list([
        indicateurReferenceSource,
        engagementReferenceSource,
      ]);
    } catch {
      return failure('DATABASE_ERROR' as const);
    }
    const source = await this.catalogue.read(
      references.map(({ lienSource }) => lienSource)
    );
    if (!source.success) return source;
    try {
      const previous = current.success ? current.data : undefined;
      return success({
        data: ElectrificationGristAdapter.build({
          source: source.data.data,
          sourceUrl: source.data.sourceUrl,
          indicateurReferences: references.filter(
            (reference) => reference.source === indicateurReferenceSource
          ),
          engagementReferences: references.filter(
            (reference) => reference.source === engagementReferenceSource
          ),
          previousActions: previous?.fiches.actions,
        }),
        revision: source.data.revision,
        excluded: 0,
      });
    } catch {
      return failure('INVALID_SOURCE' as const);
    }
  }
}
