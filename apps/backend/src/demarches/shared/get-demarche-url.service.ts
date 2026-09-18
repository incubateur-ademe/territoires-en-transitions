import { Injectable } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';

/**
 * Les URLs front des démarches, reconstruites côté serveur pour les emails.
 *
 * ⚠️ Miroir manuel de `apps/app/src/app/paths.ts`, que le backend ne peut pas
 * importer : un chemin qui change là-bas doit changer ici, sinon l'email mène
 * à une page qui n'existe plus.
 */
@Injectable()
export default class GetDemarcheUrlService {
  constructor(private readonly configService: ConfigurationService) {}

  /**
   * Le dossier vu par un service instructeur.
   *
   * Le dossier vit sous la collectivité **déposante** : c'est son identifiant
   * qui va dans l'URL, jamais celui du service qui le lit.
   */
  getDossierInstructionUrl({
    collectiviteInstruiteId,
    demandeAvisId,
  }: {
    collectiviteInstruiteId: number;
    demandeAvisId: number;
  }): string {
    return `${this.getAppUrl()}/collectivite/${collectiviteInstruiteId}/instruction/${demandeAvisId}`;
  }

  /** La démarche vue par la collectivité qui la porte. */
  getDemarchePcaetUrl({
    collectiviteId,
    demarcheId,
  }: {
    collectiviteId: number;
    demarcheId: number;
  }): string {
    return `${this.getAppUrl()}/collectivite/${collectiviteId}/demarche-pcaet/${demarcheId}`;
  }

  /** Là où se lisent les avis reçus et d'où se publie la démarche. */
  getDemarchePcaetDocumentsUrl(params: {
    collectiviteId: number;
    demarcheId: number;
  }): string {
    return `${this.getDemarchePcaetUrl(params)}/documents`;
  }

  private getAppUrl(): string {
    return this.configService.get('APP_URL');
  }
}
