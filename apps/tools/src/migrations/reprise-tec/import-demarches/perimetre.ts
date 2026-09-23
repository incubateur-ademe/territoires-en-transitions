/** Le périmètre : quelles lignes de T&C sont importées, et pourquoi les autres sont écartées. */

import { PoolClient } from 'pg';

export type LigneDemarche = {
  id: number;
  nom: string;
  description: string;
  etat: string | null;
  publie: boolean | null;
  pcaetDefinitif: number | null;
  contenu: number;
  oblige: boolean | null;
  lanceLe: string | null;
  creeLe: string | null;
  misAJourLe: string | null;
  deposeLe: string | null;
  envoiDreal: string | null;
  envoiCr: string | null;
  receptionProjet: string | null;
};

export type Motif = 'coquille_vide' | 'sans_etat_invisible' | 'doublon';

/** Lit les lignes de dossier de T&C et les trie. Passe la session en UTC : à appeler en premier. */
export const loadPerimetre = async (client: PoolClient) => {
  const lignes = await listLignesDemarche(client);
  const { retenues, ecartees } = calculatePerimetre(lignes);
  return {
    /** Le nombre de lignes de dossier lues dans T&C. */
    lues: lignes.length,
    /** Les lignes à importer. */
    retenues,
    /** Les lignes écartées, chacune avec son motif. */
    ecartees,
  };
};

/** Les lignes de dossier de T&C. `contenu` vaut 1 si le dossier n'est pas vide. */
const listLignesDemarche = async (
  client: PoolClient
): Promise<LigneDemarche[]> => {
  await client.query("set time zone 'UTC'");
  const { rows } = await client.query<LigneDemarche>(`
    select d.id::int                          as id,
           d.nom,
           coalesce(d.description_rapide, '') as description,
           d.demarche_etat_code               as etat,
           d.publie,
           d.pcaet_definitif::int             as "pcaetDefinitif",
           d.oblige,
           d.date_lancement::text             as "lanceLe",
           d.date_creation::text              as "creeLe",
           d.date_mise_a_jour::text           as "misAJourLe",
           d.date_depot_definitif::text       as "deposeLe",
           d.date_envoi_avis_dreal::text      as "envoiDreal",
           d.date_envoi_avis_cr::text         as "envoiCr",
           d.date_reception_projet::text      as "receptionProjet",
           (   exists (select from reprise_tec.staging_demarche_fichier x where x.demarche_id = d.id)
            or exists (select from reprise_tec.staging_demarche_emission_ges x where x.demarche_id = d.id)
            or exists (select from reprise_tec.staging_demarche_consommation x where x.demarche_id = d.id)
            or exists (select from reprise_tec.staging_action x where x.demarche_id = d.id)
            or exists (select from reprise_tec.staging_demarche_domaine_vulnerabilite x where x.demarche_id = d.id)
           )::int                             as contenu
      from reprise_tec.staging_demarche d
     order by d.id`);
  return rows;
};

/** Règle : écarte les dossiers vides, les sans-état jamais visibles et les doublons. */
const calculatePerimetre = (lignes: readonly LigneDemarche[]) => {
  const doublons = listDoublons(lignes);
  const contenuParDossier = calculateContenuParDossier(lignes, doublons);

  const motifDEcart = (l: LigneDemarche): Motif | null => {
    const dossier = doublons.get(l.id) ?? l.id;
    if (contenuParDossier.get(dossier) === 0) {
      return 'coquille_vide';
    }
    if (l.etat === null && !l.publie) {
      return 'sans_etat_invisible';
    }
    if (doublons.has(l.id)) {
      return 'doublon';
    }
    return null;
  };

  const ecartees = lignes.flatMap((l) => {
    const motif = motifDEcart(l);
    return motif ? [{ id: l.id, motif }] : [];
  });
  const retenues = lignes.filter((l) => motifDEcart(l) === null);

  return { retenues, ecartees };
};

/**
 * Un PCAET déposé existe deux fois dans T&C : le dossier (« mise en œuvre ») et
 * son doublon (« définitif »). Rend, pour chaque doublon, son dossier.
 */
const listDoublons = (lignes: readonly LigneDemarche[]) =>
  new Map(
    lignes
      .filter((l) => l.pcaetDefinitif !== null)
      .map((l) => [l.pcaetDefinitif as number, l.id])
  );

/** Le contenu de chaque dossier, doublon compris. */
const calculateContenuParDossier = (
  lignes: readonly LigneDemarche[],
  doublons: Map<number, number>
) => {
  const contenu = new Map<number, number>();
  for (const l of lignes) {
    const dossier = doublons.get(l.id) ?? l.id;
    contenu.set(dossier, (contenu.get(dossier) ?? 0) + l.contenu);
  }
  return contenu;
};
