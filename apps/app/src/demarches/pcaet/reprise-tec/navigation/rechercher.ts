import type { RecetteCollectivite } from '../data/use-list-collectivites';

export type Suggestion =
  | { type: 'region'; region: string }
  | { type: 'departement'; region: string | null; departement: string }
  | { type: 'collectivite'; collectivite: RecetteCollectivite }
  | {
      type: 'dossier';
      collectivite: RecetteCollectivite;
      tecDossierId: number;
      demarcheId: number | null;
    };

const normalize = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const MAX_SUGGESTIONS = 12;

export const rechercher = (
  collectivites: RecetteCollectivite[],
  saisie: string
): Suggestion[] => {
  const texte = normalize(saisie.trim());
  if (texte.length < 2) {
    return [];
  }

  const idTet = /^(?:id[\s:]*)?tet[\s:-]*(\d{1,7})$|^id[\s:-]*(\d{1,7})$/.exec(
    texte
  );
  const idTec = /^(?:id[\s:]*)?t\s*&?\s*c[\s:-]*(\d{1,7})$/.exec(texte);
  const nombre = /^\d{1,7}$/.test(texte) ? Number(texte) : null;
  if (idTet || idTec || nombre !== null) {
    const tet = idTet ? Number(idTet[1] ?? idTet[2]) : nombre;
    const tec = idTec ? Number(idTec[1]) : nombre;
    return collectivites.flatMap((c) => [
      ...(tet !== null && c.collectiviteId === tet
        ? [{ type: 'collectivite' as const, collectivite: c }]
        : []),
      ...c.dossiers
        .filter(
          (d) =>
            (tet !== null && d.demarcheId === tet) ||
            (tec !== null && (d.tecDossierId === tec || d.copieId === tec))
        )
        .map((d) => ({
          type: 'dossier' as const,
          collectivite: c,
          tecDossierId: d.tecDossierId,
          demarcheId: d.demarcheId,
        })),
    ]);
  }

  const mots = texte.split(/\s+/);
  const correspond = (valeurs: (string | null)[]) => {
    const cible = normalize(valeurs.filter(Boolean).join(' '));
    return mots.every((mot) => cible.includes(mot));
  };

  const regions = new Set<string>();
  const departements = new Map<string, string | null>();
  for (const c of collectivites) {
    if (c.region) regions.add(c.region);
    if (c.departement) departements.set(c.departement, c.region);
  }

  return [
    ...[...regions]
      .filter((r) => correspond([r]))
      .map((region) => ({ type: 'region' as const, region })),
    ...[...departements]
      .filter(([d]) => correspond([d]))
      .map(([departement, region]) => ({
        type: 'departement' as const,
        departement,
        region,
      })),
    ...collectivites
      .filter((c) => correspond([c.nom, c.nomTet, c.siren]))
      .map((collectivite) => ({ type: 'collectivite' as const, collectivite })),
  ].slice(0, MAX_SUGGESTIONS);
};
