import {
  isPremiereEtoileDemande,
  ParcoursLabellisation,
} from '@tet/domain/referentiels';

export function isPremiereEtoileDemandePending(
  parcours: Pick<ParcoursLabellisation, 'status' | 'demande'> | null | undefined
): boolean {
  if (!parcours) {
    return false;
  }
  return (
    parcours.status === 'demande_envoyee' &&
    isPremiereEtoileDemande(parcours.demande)
  );
}
