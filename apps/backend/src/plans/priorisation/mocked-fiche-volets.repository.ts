import { Injectable, Logger } from '@nestjs/common';
import { success, type Result } from '@tet/backend/utils/result.type';
import { FicheVoletsError } from './fiche-volets.errors';
import { FicheVolets, FicheVoletsRepository } from './fiche-volets.repository';

@Injectable()
export class MockedFicheVoletsRepository implements FicheVoletsRepository {
  private readonly logger = new Logger(MockedFicheVoletsRepository.name);

  async saveVolets(
    collectiviteId: number,
    fiches: FicheVolets[]
  ): Promise<Result<void, FicheVoletsError>> {
    const voletCount = fiches.reduce(
      (total, fiche) => total + fiche.volets.length,
      0
    );
    this.logger.log(
      `Écriture simulée de ${voletCount} volets sur ${fiches.length} fiches de la collectivité ${collectiviteId}`
    );
    return success(undefined);
  }
}
