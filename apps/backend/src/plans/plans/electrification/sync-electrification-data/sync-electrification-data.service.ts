import { Injectable, Logger } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationDataError } from '../publish-electrification-data/electrification-data.errors';
import {
  ElectrificationDataService,
  ElectrificationPublicationContext,
} from '../publish-electrification-data/electrification-data.service';
import { PrepareElectrificationDataService } from '../publish-electrification-data/prepare-electrification-data.service';
import { ElectrificationDataKind } from '../publish-electrification-data/publish-electrification-data.input';

type SyncSummary = {
  kind: 'catalogue' | 'laureats';
  version: string;
  sourceRevision: string;
  source: string | undefined;
  count: number;
  excluded: number;
  published: boolean;
  status: 'verified' | 'published' | 'unchanged';
};

/** Entrée interne du runner CI ; aucun endpoint ni session utilisateur simulée. */
@Injectable()
export class SyncElectrificationDataService {
  private readonly logger = new Logger(SyncElectrificationDataService.name);
  constructor(
    private readonly preparation: PrepareElectrificationDataService,
    private readonly data: ElectrificationDataService
  ) {}

  async sync(
    kind: ElectrificationDataKind,
    publish: boolean,
    context: ElectrificationPublicationContext
  ): Promise<Result<SyncSummary, ElectrificationDataError>> {
    const result = await this.preparation.prepareForSync(kind);
    if (!result.success) return result;
    const candidate = result.data;
    if (!candidate.valid) {
      // Localiser l'erreur sans exposer les valeurs de l'annuaire dans les logs CI.
      this.logger.warn(
        `Données invalides : ${candidate.issues
          .map(({ location }) => location)
          .join(', ')}`
      );
      return failure('INVALID_DATA');
    }
    let version = candidate.data.version;
    let changed = false;
    if (publish) {
      const published = await this.data.publishFromSource(
        kind,
        candidate.data,
        {
          ...context,
          sourceRevision: candidate.sourceRevision,
        }
      );
      if (!published.success) return published;
      version = published.data.version;
      changed = published.data.changed;
    }
    return success({
      kind,
      version,
      sourceRevision: candidate.sourceRevision,
      source: candidate.data.source,
      count:
        'laureats' in candidate.data
          ? candidate.data.laureats.length
          : candidate.data.fiches.actions?.length ?? 0,
      excluded: candidate.excluded,
      published: publish && changed,
      status: !publish ? 'verified' : changed ? 'published' : 'unchanged',
    });
  }
}
