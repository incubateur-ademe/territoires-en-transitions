import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { unaccent } from '@/backend/utils/unaccent.utils';
import { Injectable, Logger } from '@nestjs/common';
import { format as formatDate } from 'date-fns';
import z from 'zod';
import PlanActionsService from '../plan-actions.service';
import { exportPlanDOCX } from './export-plan.docx';
import { exportPlanXLSX } from './export-plan.xlsx';

export const exportRequestSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
  format: z.enum(['xlsx', 'docx']),
});
type ExportRequest = z.infer<typeof exportRequestSchema>;

@Injectable()
export class ExportService {
  private db = this.database.db;
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly planActionsService: PlanActionsService,
    private readonly collectivitesService: CollectivitesService
  ) {}

  async export(request: ExportRequest, user: AuthUser) {
    const { collectiviteId, planId, format } = request;

    this.logger.log(
      `Export ${format} du plan d'action ${planId} de la collectivité ${collectiviteId}`
    );

    // charge le plan
    const plan = await this.planActionsService.getPlan(
      { collectiviteId, planId },
      user
    );

    // charge le nom de la collectivité pour l'inclure dans le nom du fichier
    const collectivite = await this.collectivitesService.getCollectivite(
      collectiviteId
    );
    const collectiviteName = collectivite.collectivite.nom;

    const filename = unaccent(
      `Export_${collectiviteName}_${plan.root.nom || 'Sans titre'}_${formatDate(
        new Date(),
        'yyyy-MM-dd'
      )}.${format}`
    );

    const exportPlan = format === 'xlsx' ? exportPlanXLSX : exportPlanDOCX;
    const buffer = await exportPlan(plan);

    return { buffer, filename };
  }
}
