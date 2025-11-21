import { Injectable } from '@nestjs/common';
import ConfigurationService from './config/configuration.service';

@Injectable()
export default class GetUrlService {
  //  private readonly logger = new Logger(GetUrlService.name);

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
}
