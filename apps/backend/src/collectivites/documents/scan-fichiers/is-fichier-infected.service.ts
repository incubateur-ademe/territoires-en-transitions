import { Injectable } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { ScanFichiersRepository } from './scan-fichiers.repository';

/**
 * Un contenu jugé infecté, vu des utilisateurs. Toujours faux en mode
 * `audit` : l'audit ne doit rien changer à ce qu'ils voient.
 */
@Injectable()
export class IsFichierInfectedService {
  constructor(
    private readonly repository: ScanFichiersRepository,
    private readonly configurationService: ConfigurationService
  ) {}

  async isInfected(hash: string): Promise<boolean> {
    if (this.configurationService.get('FICHIER_SCAN_MODE') !== 'enforce') {
      return false;
    }
    return this.repository.isHashInfected(hash);
  }
}
