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

/** Porteurs dont le SIREN de T&C n'est plus celui de TeT : SIREN T&C, SIREN TeT. */
const SIRENS_RATTACHES: readonly (readonly [string, string])[] = [
  ['257202317', '200078426'], // SM du Pays du Mans
  ['286218245', '200075869'], // PETR Pays Loire Beauce
  ['200001337', '200093995'], // Syndicat des Territoires de l'Est Cantal
  ['255902330', '200078681'], // PETR du Pays du Cambrésis
  ['908780422', '200039865'], // Metz Métropole
  ['200025179', '200077634'], // Pays de la Baie du Mont-Saint-Michel, devenu PETR
  ['251302311', '200076289'], // Pays d'Arles, devenu PETR
  ['200050003', '200001873'], // Pays de la Vallée de la Sarthe
];

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
 * par SIREN sinon (celui de `SIRENS_RATTACHES` s'il a changé), toujours du même type :
 * les départements de TeT n'ont pas de SIREN.
 * `collectivitesTrouvees` compte les réponses : la base ne garantit pas l'unicité.
 */
const listPorteurs = async (
  client: PoolClient
): Promise<Map<number, Porteur>> => {
  const { rows } = await client.query<Porteur>(
    `
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
    ),
    rattache as (
      select * from unnest($1::text[], $2::text[]) as r(siren_tec, siren_tet)
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
      left join rattache r on r.siren_tec = p.siren
      left join public.collectivite tet
        on tet.type = p.type_tet
       and case p.type_tet
             when 'commune' then tet.commune_code = p.insee_commune_siege
             when 'departement' then tet.departement_code = p.departement_code
             else tet.siren = coalesce(r.siren_tet, p.siren)
           end`,
    [
      SIRENS_RATTACHES.map(([tec]) => tec),
      SIRENS_RATTACHES.map(([, tet]) => tet),
    ]
  );
  return new Map(rows.map((p) => [p.demarcheId, p]));
};

const decrirePorteur = (porteur: Porteur | undefined) =>
  porteur
    ? `${porteur.nom} (SIREN ${porteur.siren})`
    : 'aucune collectivité dans T&C';
