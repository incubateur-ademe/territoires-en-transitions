import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success, type Result } from '@tet/backend/utils/result.type';
import { FicheLeviersError } from './fiche-leviers.errors';
import {
  FicheLeviers,
  FicheLeviersRepository,
} from './fiche-leviers.repository';

@Injectable()
export class MockedFicheLeviersRepository implements FicheLeviersRepository {
  private readonly logger = new Logger(MockedFicheLeviersRepository.name);

  async saveLeviers(
    collectiviteId: number,
    fiches: FicheLeviers[],
    _tx?: Transaction
  ): Promise<Result<void, FicheLeviersError>> {
    const levierCount = fiches.reduce(
      (total, fiche) => total + fiche.leviers.length,
      0
    );
    this.logger.log(
      `Écriture simulée de ${levierCount} couples levier-catégorie sur ${fiches.length} fiches de la collectivité ${collectiviteId}`
    );
    return success(undefined);
  }
}
