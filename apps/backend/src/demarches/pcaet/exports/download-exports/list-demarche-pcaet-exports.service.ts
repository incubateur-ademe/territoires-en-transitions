import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { BuildDemarchePcaetWorkbooksService } from '../build-workbooks/build-demarche-pcaet-workbooks.service';
import { DemarchePcaetExportsError } from './demarche-pcaet-exports.errors';
import type { DemarchePcaetExportRef } from './demarche-pcaet-exports.input';
import type {
  DemarchePcaetExportEntry,
  ListDemarchePcaetExportsOutput,
} from './demarche-pcaet-exports.output';
import { ResolveDemarchePcaetExportsService } from './resolve-demarche-pcaet-exports.service';

/**
 * Les classeurs proposés sur la page du dépôt. Le front ne connaît que `plan`
 * et `indicateurs` : la variante du plan est choisie par la résolution.
 */
@Injectable()
export class ListDemarchePcaetExportsService {
  constructor(
    private readonly resolveService: ResolveDemarchePcaetExportsService,
    private readonly buildWorkbooksService: BuildDemarchePcaetWorkbooksService
  ) {}

  async list(
    ref: DemarchePcaetExportRef,
    { user, tx }: ServiceSecondArg
  ): Promise<
    Result<ListDemarchePcaetExportsOutput, DemarchePcaetExportsError>
  > {
    const resolved = await this.resolveService.resolve(ref, { user, tx });
    if (!resolved.success) {
      return resolved;
    }
    const { sources, demarcheId, collectiviteId } = resolved.data;

    switch (sources.source) {
      case 'none':
        return success({ plan: null, indicateurs: null });
      case 'snapshot': {
        const toEntry = (
          row: (typeof sources.rows)['plan']
        ): DemarchePcaetExportEntry =>
          row === null
            ? null
            : {
                source: 'snapshot',
                transition: row.transition,
                createdAt: row.createdAt,
              };
        return success({
          plan: toEntry(sources.rows.plan),
          indicateurs: toEntry(sources.rows.indicateurs),
        });
      }
      case 'on_demand': {
        // Pas de bouton s'il n'y a rien à exporter : pas de plan lié abouti,
        // ou un diagnostic vide.
        const content = await this.buildWorkbooksService.hasContent(
          { demarcheId, collectiviteId },
          { user, tx }
        );
        if (!content.success) {
          return content;
        }
        return success({
          plan: content.data.plan ? { source: 'on_demand' } : null,
          indicateurs: content.data.indicateurs
            ? { source: 'on_demand' }
            : null,
        });
      }
    }
  }
}
