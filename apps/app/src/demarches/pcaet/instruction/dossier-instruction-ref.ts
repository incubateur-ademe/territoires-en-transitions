import type { RouterInput } from '@tet/api';

/**
 * Ce qui désigne un dossier lu par un service : sa saisine une fois transmis,
 * sa démarche tant qu'il est en élaboration. La forme est celle que le serveur
 * attend — les hooks la passent telle quelle.
 */
export type DossierInstructionRef =
  RouterInput['demarches']['pcaet']['getDossierInstruction'];
