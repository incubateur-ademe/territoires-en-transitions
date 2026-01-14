import { Injectable, Logger } from '@nestjs/common';
import { DownloadPlanReportQueryParams } from '@tet/domain/plans';
import ConfigurationService from '../../utils/config/configuration.service';

@Injectable()
export default class GetPlanUrlService {
  private readonly logger = new Logger(GetPlanUrlService.name);

  constructor(private readonly configService: ConfigurationService) {}

  // génère l'URL vers une fiche ou une sous-fiche
  getFicheUrl({
    collectiviteId,
    planId,
    ficheId,
    parentId,
  }: {
    collectiviteId: number;
    planId: number | null;
    ficheId: number;
    parentId: number | null;
  }) {
    const appUrl = this.configService.get('APP_URL');
    return `${appUrl}/collectivite/${collectiviteId}/fiches/${
      parentId ? `${parentId}#${ficheId}` : ficheId
    }/details${planId ? `?planId=${planId}` : ''}`;
  }

  getPlanUrl({
    collectiviteId,
    planId,
    queryParams,
  }: {
    collectiviteId: number;
    planId: number | null;
    queryParams?: any;
  }) {
    const appUrl = this.configService.get('APP_URL');
    const queryParamsString = queryParams
      ? new URLSearchParams(queryParams).toString()
      : '';
    return `${appUrl}/collectivite/${collectiviteId}/plans/${planId}${
      queryParams ? `?${queryParamsString}` : ''
    }`;
  }

  getPlanDownloadReportUrl({
    collectiviteId,
    planId,
    reportId,
  }: {
    collectiviteId: number;
    planId: number;
    reportId: string;
  }) {
    const queryParams: DownloadPlanReportQueryParams = {
      downloadReportId: reportId,
    };
    return this.getPlanUrl({ collectiviteId, planId, queryParams });
  }
}
