import type { RecetteCollectivite } from './use-list-collectivites';

const normalize = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export const filterCollectivites = (
  collectivites: RecetteCollectivite[],
  recherche: string
) => {
  const mots = normalize(recherche).split(/\s+/).filter(Boolean);
  if (mots.length === 0) {
    return collectivites;
  }
  return collectivites.filter((c) => {
    const texte = normalize(
      [
        c.nom,
        c.nomTet,
        c.siren,
        c.region,
        c.departement,
        c.collectiviteId,
        c.tecCollectiviteId,
      ].join(' ')
    );
    return mots.every((mot) => texte.includes(mot));
  });
};
