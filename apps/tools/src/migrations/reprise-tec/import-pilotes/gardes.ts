/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import { PoolClient } from 'pg';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsNoms } from './personne-tag';
import {
  listCasBloquantsPilotes,
  type PiloteDossier,
  type PiloteFiche,
} from './pilotes';

/** Arrête avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = async (
  client: PoolClient,
  pilotes: {
    dossiers: readonly PiloteDossier[];
    fiches: readonly PiloteFiche[];
  }
) => {
  const cas = [
    ...(await listCasBloquantsPilotes(client)),
    ...(await listCasBloquantsEcriture(client)),
    ...listCasBloquantsNoms([...pilotes.dossiers, ...pilotes.fiches]),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
