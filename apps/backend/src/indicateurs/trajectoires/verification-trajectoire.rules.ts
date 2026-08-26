import { Injectable } from '@nestjs/common';
import {
  UnsupportedTrajectoireStatus,
  VerificationTrajectoireStatus,
} from '@tet/domain/indicateurs';
import { DataInputForTrajectoireCompute } from './donnees-calcul-trajectoire-a-remplir.dto';

export const EPCI_FISCALITE_PROPRE_REQUIRED_MESSAGE =
  'Le calcul de trajectoire SNBC peut uniquement être effectué pour un EPCI à fiscalité propre.';

export const UNSUPPORTED_SYNDICAT_MESSAGE =
  "La méthodologie SNBC territorialisée s'appuie sur le découpage en EPCI à fiscalité propre et n'est pas applicable au périmètre d'un syndicat.";

export const MISSING_COLLECTIVITE_MESSAGE =
  'Les informations de la collectivité sont absentes du résultat de vérification, impossible de calculer la trajectoire SNBC.';

export const UNSUPPORTED_MESSAGES: Record<
  UnsupportedTrajectoireStatus,
  string
> = {
  [VerificationTrajectoireStatus.COMMUNE_NON_SUPPORTEE]:
    EPCI_FISCALITE_PROPRE_REQUIRED_MESSAGE,
  [VerificationTrajectoireStatus.SYNDICAT_NON_SUPPORTE]:
    UNSUPPORTED_SYNDICAT_MESSAGE,
};

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
