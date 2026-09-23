import { Dossier } from './dossier';
import { Porteur } from './lecture';

/** Arrête tout avant d'écrire si une collectivité est introuvable. */
export const validateCollectivites = (
  dossiers: readonly Dossier[],
  porteurs: Map<number, Porteur>
) => {
  const introuvables = dossiers.filter(
    (d) => d.colonnes.collectiviteId === null
  );
  if (introuvables.length === 0) {
    return;
  }

  const lignes = introuvables.map((d) => {
    const porteur = porteurs.get(d.tecId);
    return `  ${d.tecId} ${porteur?.nom ?? 'aucune collectivité'} (SIREN ${
      porteur?.siren
    })`;
  });
  throw new Error(
    `${introuvables.length} dossier(s) dont la collectivité est introuvable dans TeT. Rien n'est écrit.\n` +
      lignes.join('\n')
  );
};
