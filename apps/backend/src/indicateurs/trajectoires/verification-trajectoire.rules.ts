import { Injectable } from '@nestjs/common';
import { VerificationTrajectoireStatus } from '@tet/domain/indicateurs';
import { DataInputForTrajectoireCompute } from './donnees-calcul-trajectoire-a-remplir.dto';

@Injectable()
export class VerificationTrajectoireRules {
  getStatus({
    canTrajectoireBeComputed,
    donneesEntree,
    existingTrajectoireData,
  }: {
    canTrajectoireBeComputed: boolean;
    donneesEntree: DataInputForTrajectoireCompute;
    existingTrajectoireData: {
      modifiedAt: string | undefined;
    };
  }): VerificationTrajectoireStatus {
    if (canTrajectoireBeComputed === false) {
      return VerificationTrajectoireStatus.DONNEES_MANQUANTES;
    }

    if (existingTrajectoireData.modifiedAt === undefined) {
      return VerificationTrajectoireStatus.PRET_A_CALCULER;
    }

    const newTrajectoireCanBeComputed =
      donneesEntree.lastModifiedAt &&
      existingTrajectoireData.modifiedAt &&
      donneesEntree.lastModifiedAt > existingTrajectoireData.modifiedAt;

    if (newTrajectoireCanBeComputed) {
      return VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE;
    }
    return VerificationTrajectoireStatus.DEJA_CALCULE;
  }
}
