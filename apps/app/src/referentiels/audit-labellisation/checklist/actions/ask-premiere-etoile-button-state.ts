import { ParcoursLabellisation } from '@tet/domain/referentiels';
import { isPremiereEtoileDemandeEnCours } from '../../premiere-etoile-demande-en-cours';

export type AskPremiereEtoileButtonState =
  | 'requestable'
  | 'criteres-incomplets'
  | 'demande-en-cours';

export const getAskPremiereEtoileButtonState = ({
  canAskFirstStar,
  parcours,
}: {
  canAskFirstStar: boolean;
  parcours: Pick<ParcoursLabellisation, 'status' | 'demande'> | null;
}): AskPremiereEtoileButtonState => {
  if (isPremiereEtoileDemandeEnCours(parcours)) {
    return 'demande-en-cours';
  }
  if (canAskFirstStar) {
    return 'requestable';
  }
  return 'criteres-incomplets';
};
