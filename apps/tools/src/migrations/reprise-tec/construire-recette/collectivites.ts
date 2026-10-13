import { PoolClient } from 'pg';
import type { Porteur } from '../import-demarches/collectivites';

export const createTableCollectivites = async (client: PoolClient) => {
  await client.query(`
    drop table if exists reprise_tec.recette_collectivite;
    create table reprise_tec.recette_collectivite (
      tec_collectivite_id bigint primary key,
      tet_collectivite_id integer,
      nom                 text not null,
      siren               text,
      population          bigint
    );
    create index on reprise_tec.recette_collectivite (tet_collectivite_id);
  `);
};

export const createCollectivites = async (
  client: PoolClient,
  porteurs: readonly Porteur[]
) => {
  const tetParTec = new Map(
    porteurs.map((p) => [
      p.tecCollectiviteId,
      p.collectivitesTrouvees === 1 ? p.collectiviteId : null,
    ])
  );
  const { rowCount } = await client.query(
    `
    insert into reprise_tec.recette_collectivite
      (tec_collectivite_id, tet_collectivite_id, nom, siren, population)
    select c.id, p.tet_id, c.nom, lpad(c.siren, 9, '0'), c.population
      from unnest($1::bigint[], $2::integer[]) as p(tec_id, tet_id)
      join reprise_tec.staging_collectivite c on c.id = p.tec_id`,
    [[...tetParTec.keys()], [...tetParTec.values()]]
  );
  return {
    ecrites: rowCount ?? 0,
    sansTet: [...tetParTec.values()].filter((id) => id === null).length,
  };
};
