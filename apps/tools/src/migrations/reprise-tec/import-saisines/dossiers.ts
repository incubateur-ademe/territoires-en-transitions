/** Les dossiers à saisir : les dossiers repris transmis pour avis ; jamais une élaboration, que la clôture de nuit passerait en instruit. */

import { PoolClient } from 'pg';

export type Dossier = {
  tecId: number;
  demarcheId: number;
  collectiviteId: number;
  collectivite: string;
};

/** Les dossiers repris transmis pour avis, par numéro T&C : deux runs écrivent dans le même ordre. */
export const loadDossiersTransmis = async (client: PoolClient) => {
  const { rows } = await client.query<Dossier>(`
    select c.tec_id::int     as "tecId",
           d.id              as "demarcheId",
           d.collectivite_id as "collectiviteId",
           co.nom            as collectivite
      from reprise_tec.correspondance c
      join public.demarche d on d.id = c.tet_id
      join public.collectivite co on co.id = d.collectivite_id
     where c.table_cible = 'demarche'
       and d.transmitted_at is not null
     order by c.tec_id`);
  return rows;
};
