import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
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

export type Porteur = {
  demarcheId: number;
  nom: string;
  siren: string | null;
  collectiviteId: number | null;
  natureInsee: string | null;
  population: number | null;
};

export type LigneSuivi = {
  obligation: string;
  approbation: string | null;
};

/** Les lignes de dossier de T&C. `contenu` vaut 1 si le dossier n'est pas vide. */
export const listLignesDemarche = async (
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

/** La collectivité TeT de chaque dossier : par code INSEE pour une commune, par SIREN sinon. */
export const listPorteurs = async (
  client: PoolClient
): Promise<Map<number, Porteur>> => {
  const { rows } = await client.query<Porteur>(`
    with porteur as (
      select distinct on (dc.demarche_id)
             dc.demarche_id,
             c.nom,
             lpad(c.siren, 9, '0') as siren,
             c.insee_commune_siege,
             case c.type_collectivite_id
               when 1 then 'region'
               when 2 then 'departement'
               when 6 then 'commune'
               else 'epci'
             end as type_tet
        from reprise_tec.staging_demarche_collectivite dc
        join reprise_tec.staging_collectivite c on c.id = dc.collectivite_id
       order by dc.demarche_id, dc.principale desc nulls last, c.id
    )
    select p.demarche_id::int as "demarcheId",
           p.nom,
           p.siren,
           tet.id             as "collectiviteId",
           tet.nature_insee   as "natureInsee",
           tet.population
      from porteur p
      left join public.collectivite tet
        on tet.type = p.type_tet
       and case when p.type_tet = 'commune'
                then tet.commune_code = p.insee_commune_siege
                else tet.siren = p.siren
           end`);
  return new Map(rows.map((p) => [p.demarcheId, p]));
};

/** Le suivi ADEME, par SIREN. Un SIREN présent deux fois est ignoré. */
export const getSuiviAdeme = (chemin: string): Map<string, LigneSuivi> => {
  const lignes = parse(readFileSync(chemin, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as { siren: string; obligation: string; date_approbation: string }[];

  const parSiren = new Map<string, typeof lignes>();
  for (const l of lignes) {
    const siren = l.siren.padStart(9, '0');
    parSiren.set(siren, [...(parSiren.get(siren) ?? []), l]);
  }

  return new Map(
    [...parSiren]
      .filter(([, memeSiren]) => memeSiren.length === 1)
      .map(([siren, [l]]) => [
        siren,
        { obligation: l.obligation, approbation: l.date_approbation || null },
      ])
  );
};
