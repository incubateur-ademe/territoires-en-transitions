import { Injectable, Logger } from '@nestjs/common';
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
    return `${appUrl}/collectivite/${collectiviteId}/plans${
      planId ? `/${planId}` : ''
    }/fiches/${parentId ? `${parentId}#${ficheId}` : ficheId}`;
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
}
