/** Les dossiers repris : ceux que la tranche 2 a écrits, où le diagnostic se range. */

import { PoolClient } from 'pg';

export type Dossier = {
  tecId: number;
  demarcheId: number;
  collectiviteId: number;
};

/** Les dossiers écrits par la tranche 2, par numéro T&C ; un doublon « définitif » n'en fait jamais partie. */
export const loadDossiers = async (
  client: PoolClient
): Promise<Map<number, Dossier>> => {
  const { rows } = await client.query<Dossier>(`
    select c.tec_id::int         as "tecId",
           d.id                  as "demarcheId",
           d.collectivite_id     as "collectiviteId"
      from reprise_tec.correspondance c
      join public.demarche d on d.id = c.tet_id
     where c.table_cible = 'demarche'`);
  return new Map(rows.map((d) => [d.tecId, d]));
};
