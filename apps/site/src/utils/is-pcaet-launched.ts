import 'server-only';

import { connection } from 'next/server';

/**
 * La page Démarche PCAET et ses points d'entrée (menu, bloc d'accueil, onglet
 * de la FAQ) restent masqués tant que `PCAET_LAUNCHED` ne vaut pas `true`.
 *
 * Lue à la requête et non au build (`connection`) : on lance la page en posant
 * la variable sur l'hébergeur, sans reconstruire l'image.
 */
export const isPcaetLaunched = async () => {
  await connection();
  return process.env.PCAET_LAUNCHED === 'true';
};
