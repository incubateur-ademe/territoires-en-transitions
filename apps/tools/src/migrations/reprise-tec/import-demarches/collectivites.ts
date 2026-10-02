/** Les collectivités : retrouve, pour chaque dossier T&C, la collectivité TeT qui le recevra. */

import { PoolClient } from 'pg';
import { decrireDossier, type Dossier } from './dossier';

/** La collectivité principale du dossier dans T&C, et sa correspondante dans TeT. */
export type Porteur = {
  demarcheId: number;
  nom: string;
  siren: string | null;
  collectiviteId: number | null;
  collectivitesTrouvees: number;
  natureInsee: string | null;
  population: number | null;
};

export type Collectivites = Awaited<ReturnType<typeof loadCollectivites>>;

/** Lit le porteur de chaque dossier T&C et sa correspondante dans TeT. */
export const loadCollectivites = async (client: PoolClient) => {
  const porteurs = await listPorteurs(client);

  const getPorteur = (tecId: number) => porteurs.get(tecId);

  const decrire = (tecId: number) => decrirePorteur(getPorteur(tecId));

  return {
    getPorteur,
    decrire,

    /**
     * Garde, appelée par `gardes.ts` : liste les cas bloquants, un par ligne.
     * - A27 : collectivité introuvable dans TeT, ou trouvée plusieurs fois.
     */
    listCasBloquants: (dossiers: readonly Dossier[]) =>
      dossiers.flatMap((d) => {
        const trouvees = getPorteur(d.tecId)?.collectivitesTrouvees ?? 0;
        if (trouvees === 1) {
          return [];
        }
        const probleme =
          trouvees === 0 ? 'introuvable' : `trouvée ${trouvees} fois`;
        return [
          `  collectivité ${probleme} dans TeT (A27) : ${decrireDossier(
            d
          )}, ${decrire(d.tecId)}`,
        ];
      }),
  };
};

/**
 * Par code INSEE pour une commune, par code (tiré du siège) pour un département,
 * par SIREN sinon, toujours du même type : les départements de TeT n'ont pas de SIREN.
 * `collectivitesTrouvees` compte les réponses : la base ne garantit pas l'unicité.
 */
const listPorteurs = async (
  client: PoolClient
): Promise<Map<number, Porteur>> => {
  const { rows } = await client.query<Porteur>(`
    with porteur as (
      select distinct on (dc.demarche_id)
             dc.demarche_id,
             c.nom,
             lpad(c.siren, 9, '0') as siren,
             c.insee_commune_siege,
             case when c.insee_commune_siege like '97%'
                  then left(c.insee_commune_siege, 3)
                  else left(c.insee_commune_siege, 2)
             end as departement_code,
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
           count(tet.id) over (partition by p.demarche_id)::int
                              as "collectivitesTrouvees",
           tet.nature_insee   as "natureInsee",
           tet.population
      from porteur p
      left join public.collectivite tet
        on tet.type = p.type_tet
       and case p.type_tet
             when 'commune' then tet.commune_code = p.insee_commune_siege
             when 'departement' then tet.departement_code = p.departement_code
             else tet.siren = p.siren
           end`);
  return new Map(rows.map((p) => [p.demarcheId, p]));
};

const decrirePorteur = (porteur: Porteur | undefined) =>
  porteur
    ? `${porteur.nom} (SIREN ${porteur.siren})`
    : 'aucune collectivité dans T&C';
