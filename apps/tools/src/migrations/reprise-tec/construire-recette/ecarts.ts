import { PoolClient } from 'pg';

type Source = {
  table: string;
  hasId: boolean;
  hasDemarcheId: boolean;
  hasActionId: boolean;
};

const toJoin = (s: Source): string | null => {
  const staging = `reprise_tec.staging_${s.table}`;
  if (s.table === 'demarche' || (!s.hasId && s.hasDemarcheId)) {
    return 'select e.tec_id as dossier, e.motif, e.precision from e';
  }
  if (s.hasId && s.hasDemarcheId) {
    return `select s.demarche_id as dossier, e.motif, e.precision
              from e left join ${staging} s on s.id = e.tec_id`;
  }
  if (s.hasId && s.hasActionId) {
    return `select a.demarche_id as dossier, e.motif, e.precision
              from e left join ${staging} s on s.id = e.tec_id
                     left join reprise_tec.staging_action a on a.id = s.action_id`;
  }
  if (s.hasActionId) {
    return `select a.demarche_id as dossier, e.motif, e.precision
              from e left join reprise_tec.staging_action a on a.id = e.tec_id`;
  }
  return null;
};

export const createEcarts = async (client: PoolClient) => {
  await client.query(`
    drop table if exists reprise_tec.recette_ecart;
    create table reprise_tec.recette_ecart (
      tec_dossier_id  bigint not null,
      table_source    text   not null,
      motif           text   not null,
      precision       text   not null,
      nombre          integer not null
    );
  `);

  const { rows: sources } = await client.query<Source>(`
    select e.table_source as "table",
           bool_or(c.column_name = 'id')          as "hasId",
           bool_or(c.column_name = 'demarche_id') as "hasDemarcheId",
           bool_or(c.column_name = 'action_id')   as "hasActionId"
      from (select distinct table_source from reprise_tec.ecarts) e
      left join information_schema.columns c
        on c.table_schema = 'reprise_tec'
       and c.table_name = 'staging_' || e.table_source
     group by e.table_source
     order by e.table_source`);

  const horsDossier: string[] = [];
  const sansDossier = new Map<string, number>();
  for (const source of sources) {
    const select = toJoin(source);
    if (select === null) {
      horsDossier.push(source.table);
      continue;
    }
    const { rows } = await client.query<{ sansDossier: number }>(
      `
      with e as (
        select tec_id, motif, precision from reprise_tec.ecarts
         where table_source = $1
      ),
      x as (${select}),
      ajout as (
        insert into reprise_tec.recette_ecart
        select dossier, $1, motif, precision, count(*)
          from x where dossier is not null
         group by dossier, motif, precision
      )
      select count(*) filter (where dossier is null)::int as "sansDossier" from x`,
      [source.table]
    );
    if (rows[0].sansDossier > 0) {
      sansDossier.set(source.table, rows[0].sansDossier);
    }
  }
  await client.query(
    'create index on reprise_tec.recette_ecart (tec_dossier_id)'
  );
  return { horsDossier, sansDossier };
};
