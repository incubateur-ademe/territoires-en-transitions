import { MembreFonction } from '@tet/domain/collectivites';
import { groupBy } from 'es-toolkit';

/** Groupe les membres par fonction */
export const groupeParFonction = <
  T extends { fonction: MembreFonction | null }
>(
  membres: T[]
) =>
  membres?.length
    ? groupBy(membres, (membre) => membre.fonction || 'non_renseigne')
    : undefined;
