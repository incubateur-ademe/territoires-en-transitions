import { PoolClient } from 'pg';
import type { Porteur } from '../import-demarches/collectivites';
import type { SuiviAdeme } from '../import-demarches/suivi-ademe';

export const createTableCollectivites = async (client: PoolClient) => {
  await client.query(`
    drop table if exists reprise_tec.recette_collectivite;
    create table reprise_tec.recette_collectivite (
      tec_collectivite_id   bigint primary key,
      tet_collectivite_id   integer,
      nom                   text not null,
      siren                 text,
      population            bigint,
      suivi_obligation      text,
      suivi_avis_etat_le    date,
      suivi_approbation_le  date
    );
    create index on reprise_tec.recette_collectivite (tet_collectivite_id);
  `);
};

export const createCollectivites = async (
  client: PoolClient,
  porteurs: readonly Porteur[],
  suivi: SuiviAdeme
) => {
  const parTec = new Map(porteurs.map((p) => [p.tecCollectiviteId, p]));
  const lignes = [...parTec.values()].map((p) => ({
    p,
    suivi: suivi.getLigne(p.siren),
  }));
  const { rowCount } = await client.query(
    `
    insert into reprise_tec.recette_collectivite
      (tec_collectivite_id, tet_collectivite_id, nom, siren, population,
       suivi_obligation, suivi_avis_etat_le, suivi_approbation_le)
    select c.id, p.tet_id, c.nom, lpad(c.siren, 9, '0'), c.population,
           p.obligation, p.avis_etat::date, p.approbation::date
      from unnest($1::bigint[], $2::integer[], $3::text[], $4::text[], $5::text[])
             as p(tec_id, tet_id, obligation, avis_etat, approbation)
      join reprise_tec.staging_collectivite c on c.id = p.tec_id`,
    [
      lignes.map(({ p }) => p.tecCollectiviteId),
      lignes.map(({ p }) =>
        p.collectivitesTrouvees === 1 ? p.collectiviteId : null
      ),
      lignes.map(({ suivi }) => suivi?.obligation ?? null),
      lignes.map(({ suivi }) => suivi?.avisEtat ?? null),
      lignes.map(({ suivi }) => suivi?.approbation ?? null),
    ]
  );
  return {
    ecrites: rowCount ?? 0,
    sansTet: lignes.filter(({ p }) => p.collectivitesTrouvees !== 1).length,
    sansSuivi: lignes.filter(({ suivi }) => !suivi).length,
  };
};
